import { google } from 'googleapis';
import { PrismaClient } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';

const prisma = new PrismaClient();

export class GoogleCalendarService {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  /**
   * Generate Google OAuth 2.0 authorization URL
   */
  getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent', // Force consent to get refresh token
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string) {
    try {
      console.log('🔄 Attempting to exchange code for tokens...');
      console.log('Code length:', code?.length || 0);
      console.log('Code starts with:', code?.substring(0, 20) + '...');

      const { tokens } = await this.oauth2Client.getToken(code);
      console.log('✅ Successfully exchanged code for tokens');
      console.log('Tokens received:', Object.keys(tokens));

      return tokens;
    } catch (error) {
      console.error('❌ Error exchanging code for tokens:', error);

      // Log more details about the error
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }

      // Check if it's a specific OAuth error
      if (typeof error === 'object' && error !== null) {
        console.error('Error details:', JSON.stringify(error, null, 2));
      }

      throw new Error('Failed to exchange authorization code for tokens');
    }
  }

  /**
   * Store calendar integration for user
   */
  async storeCalendarIntegration(userId: string, tokens: unknown) {
    try {
      // Delete existing integration if any
      await prisma.calendarIntegration.deleteMany({
        where: { userId },
      });

      // Create new integration
      const integration = await prisma.calendarIntegration.create({
        data: {
          userId,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiresAt: tokens.expiry_date
            ? new Date(tokens.expiry_date)
            : null,
          googleCalendarId: 'primary', // Default to primary calendar
        },
      });

      return integration;
    } catch (error) {
      console.error('Error storing calendar integration:', error);
      throw new Error('Failed to store calendar integration');
    }
  }

  /**
   * Get calendar integration for user
   */
  async getCalendarIntegration(userId: string) {
    try {
      return await prisma.calendarIntegration.findFirst({
        where: { userId },
      });
    } catch (error) {
      console.error('Error getting calendar integration:', error);
      throw new Error('Failed to get calendar integration');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(userId: string) {
    try {
      const integration = await this.getCalendarIntegration(userId);

      if (!integration || !integration.refreshToken) {
        throw new Error('No refresh token available');
      }

      this.oauth2Client.setCredentials({
        refresh_token: integration.refreshToken,
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();

      // Update stored tokens
      await prisma.calendarIntegration.update({
        where: { id: integration.id },
        data: {
          accessToken: credentials.access_token,
          tokenExpiresAt: credentials.expiry_date
            ? new Date(credentials.expiry_date)
            : null,
        },
      });

      return credentials;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  /**
   * Get authenticated calendar client for user
   */
  async getCalendarClient(userId: string) {
    try {
      const integration = await this.getCalendarIntegration(userId);

      if (!integration) {
        throw new Error('No calendar integration found');
      }

      // Check if token needs refresh
      const now = new Date();
      const tokenExpiry = integration.tokenExpiresAt;

      if (tokenExpiry && now >= tokenExpiry) {
        // Token expired, refresh it
        await this.refreshAccessToken(userId);
        // Get updated integration
        const updatedIntegration = await this.getCalendarIntegration(userId);
        if (!updatedIntegration) {
          throw new Error('Failed to get updated integration after refresh');
        }
        integration.accessToken = updatedIntegration.accessToken;
      }

      this.oauth2Client.setCredentials({
        access_token: integration.accessToken,
        refresh_token: integration.refreshToken,
      });

      return google.calendar({ version: 'v3', auth: this.oauth2Client });
    } catch (error) {
      console.error('Error getting calendar client:', error);
      throw new Error('Failed to get calendar client');
    }
  }

  /**
   * Disconnect calendar integration
   */
  async disconnectCalendar(userId: string) {
    try {
      await prisma.calendarIntegration.deleteMany({
        where: { userId },
      });
      return true;
    } catch (error) {
      console.error('Error disconnecting calendar:', error);
      throw new Error('Failed to disconnect calendar');
    }
  }

  /**
   * Test calendar connection
   */
  async testConnection(userId: string) {
    try {
      const calendar = await this.getCalendarClient(userId);
      const response = await calendar.calendarList.list();
      return {
        connected: true,
        calendars: response.data.items?.length || 0,
      };
    } catch (error) {
      console.error('Error testing calendar connection:', error);
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();
