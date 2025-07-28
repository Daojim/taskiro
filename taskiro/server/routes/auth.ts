import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';

import {
  registerValidation,
  loginValidation,
  refreshTokenValidation,
} from '../middleware/validation';
import {
  generateTokens,
  verifyRefreshToken,
  authenticateToken,
  AuthenticatedRequest,
} from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { prisma, createDefaultCategories } from '../utils/database';

const router = express.Router();

// Constants
const BCRYPT_SALT_ROUNDS = 12;

// Reusable user selection patterns
const PUBLIC_USER_SELECT = {
  id: true,
  email: true,
  createdAt: true,
} as const;

const USER_WITH_PASSWORD_SELECT = {
  ...PUBLIC_USER_SELECT,
  passwordHash: true,
} as const;

const PROFILE_USER_SELECT = {
  ...PUBLIC_USER_SELECT,
  updatedAt: true,
} as const;

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth endpoints
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// User registration
router.post(
  '/register',
  authLimiter,
  registerValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw createError(
          'User with this email already exists',
          409,
          'USER_EXISTS'
        );
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
        },
        select: PUBLIC_USER_SELECT,
      });

      // Create default categories for the new user
      await createDefaultCategories(user.id);

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user.id, user.email);

      res.status(201).json({
        message: 'User registered successfully',
        user,
        tokens: {
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// User login
router.post(
  '/login',
  authLimiter,
  loginValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        select: USER_WITH_PASSWORD_SELECT,
      });

      if (!user) {
        throw createError(
          'Invalid email or password',
          401,
          'INVALID_CREDENTIALS'
        );
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

      if (!isPasswordValid) {
        throw createError(
          'Invalid email or password',
          401,
          'INVALID_CREDENTIALS'
        );
      }

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user.id, user.email);

      // Return user data without password hash
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash: _, ...userWithoutPassword } = user;

      res.json({
        message: 'Login successful',
        user: userWithoutPassword,
        tokens: {
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Refresh access token
router.post(
  '/refresh',
  refreshTokenValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;

      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Verify user still exists
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: PUBLIC_USER_SELECT,
      });

      if (!user) {
        throw createError('User not found', 401, 'USER_NOT_FOUND');
      }

      // Generate new tokens
      const tokens = generateTokens(user.id, user.email);

      res.json({
        message: 'Token refreshed successfully',
        user,
        tokens,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Logout (client-side token removal, but we can add token blacklisting later)
router.delete(
  '/logout',
  authenticateToken,
  async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // For now, logout is handled client-side by removing tokens
      // In a production app, you might want to implement token blacklisting

      res.json({
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get current user profile
router.get(
  '/me',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: PROFILE_USER_SELECT,
      });

      if (!user) {
        throw createError('User not found', 404, 'USER_NOT_FOUND');
      }

      res.json({
        user,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
