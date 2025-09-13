import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { dateParsingService } from '../services/dateParsingService';
import { ParseRequest, ParseResponse } from '../types/nlp';

const router = express.Router();

/**
 * POST /api/nlp/parse
 * Parse natural language input to extract task information
 */
router.post(
  '/parse',
  [
    body('input')
      .isString()
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Input must be a string between 1 and 1000 characters'),
    body('referenceDate')
      .optional()
      .isISO8601()
      .withMessage('Reference date must be a valid ISO 8601 date'),
    body('timezone')
      .optional()
      .isString()
      .withMessage('Timezone must be a valid IANA timezone identifier'),
  ],
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    try {
      const { input, referenceDate, timezone }: ParseRequest = req.body;

      // Create reference date in user's timezone if provided
      let refDate: Date;
      if (referenceDate) {
        refDate = new Date(referenceDate);
      } else if (timezone) {
        // Get current time in user's timezone
        refDate = new Date(
          new Date().toLocaleString('en-US', { timeZone: timezone })
        );
      } else {
        refDate = new Date();
      }

      const parsed = dateParsingService.parseInput(input, refDate, timezone);

      const response: ParseResponse = {
        parsed,
        success: true,
      };

      res.json(response);
    } catch (error) {
      console.error('Error parsing natural language input:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to parse natural language input',
      });
    }
  }
);

/**
 * POST /api/nlp/disambiguate
 * Resolve ambiguous dates by providing suggestions
 * Requirements 2.4, 2.5: Generate date options for ambiguous expressions
 */
router.post(
  '/disambiguate',
  [
    body('dateText')
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Date text must be a string between 1 and 100 characters'),
    body('referenceDate')
      .optional()
      .isISO8601()
      .withMessage('Reference date must be a valid ISO 8601 date'),
    body('timezone')
      .optional()
      .isString()
      .withMessage('Timezone must be a valid IANA timezone identifier'),
  ],
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    try {
      const { dateText, referenceDate, timezone } = req.body;

      // Create reference date in user's timezone if provided
      let refDate: Date;
      if (referenceDate) {
        refDate = new Date(referenceDate);
      } else if (timezone) {
        // Get current time in user's timezone
        refDate = new Date(
          new Date().toLocaleString('en-US', { timeZone: timezone })
        );
      } else {
        refDate = new Date();
      }

      // Generate disambiguation suggestions directly
      const ambiguousElements =
        dateParsingService.generateDisambiguationSuggestions(
          dateText,
          refDate,
          timezone
        );

      res.json({
        success: true,
        ambiguousElements,
      });
    } catch (error) {
      console.error('Error disambiguating date:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to disambiguate date',
      });
    }
  }
);

/**
 * POST /api/nlp/parse-relative-date
 * Parse relative date expressions
 */
router.post(
  '/parse-relative-date',
  [
    body('dateText')
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Date text must be a string between 1 and 100 characters'),
    body('referenceDate')
      .optional()
      .isISO8601()
      .withMessage('Reference date must be a valid ISO 8601 date'),
    body('timezone')
      .optional()
      .isString()
      .withMessage('Timezone must be a valid IANA timezone identifier'),
  ],
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    try {
      const { dateText, referenceDate, timezone } = req.body;

      // Create reference date in user's timezone if provided
      let refDate: Date;
      if (referenceDate) {
        refDate = new Date(referenceDate);
      } else if (timezone) {
        // Get current time in user's timezone
        refDate = new Date(
          new Date().toLocaleString('en-US', { timeZone: timezone })
        );
      } else {
        refDate = new Date();
      }

      const parsedDate = dateParsingService.parseRelativeDate(
        dateText,
        refDate,
        timezone
      );

      res.json({
        success: true,
        parsedDate,
        originalText: dateText,
      });
    } catch (error) {
      console.error('Error parsing relative date:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to parse relative date',
      });
    }
  }
);

/**
 * POST /api/nlp/suggest-category
 * Suggest category based on task content
 * Requirements 4.6, 4.7: Implement category suggestion based on task content
 */
router.post(
  '/suggest-category',
  [
    body('text')
      .isString()
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Text must be a string between 1 and 1000 characters'),
  ],
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    try {
      const { text } = req.body;

      const suggestion = dateParsingService.getCategorySuggestion(text);

      res.json({
        success: true,
        suggestion,
      });
    } catch (error) {
      console.error('Error suggesting category:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to suggest category',
      });
    }
  }
);

export default router;
