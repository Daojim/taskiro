import express from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
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

const router = express.Router();
const prisma = new PrismaClient();

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
  async (req, res, next) => {
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
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
        },
        select: {
          id: true,
          email: true,
          createdAt: true,
        },
      });

      // Create default categories for the new user
      await prisma.category.createMany({
        data: [
          {
            userId: user.id,
            name: 'Work',
            color: '#3B82F6',
            isDefault: true,
          },
          {
            userId: user.id,
            name: 'Personal',
            color: '#10B981',
            isDefault: true,
          },
          {
            userId: user.id,
            name: 'School',
            color: '#F59E0B',
            isDefault: true,
          },
        ],
      });

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
router.post('/login', authLimiter, loginValidation, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        createdAt: true,
      },
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
});

// Refresh access token
router.post('/refresh', refreshTokenValidation, async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
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
});

// Logout (client-side token removal, but we can add token blacklisting later)
router.delete(
  '/logout',
  authenticateToken,
  async (req: AuthenticatedRequest, res, next) => {
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
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          id: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
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
