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
      const { input, referenceDate }: ParseRequest = req.body;
      const refDate = referenceDate ? new Date(referenceDate) : new Date();

      const parsed = dateParsingService.parseInput(input, refDate);

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
      const { dateText, referenceDate } = req.body;
      const refDate = referenceDate ? new Date(referenceDate) : new Date();

      // Generate disambiguation suggestions directly
      const ambiguousElements =
        dateParsingService.generateDisambiguationSuggestions(dateText, refDate);

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
      const { dateText, referenceDate } = req.body;
      const refDate = referenceDate ? new Date(referenceDate) : new Date();

      const parsedDate = dateParsingService.parseRelativeDate(
        dateText,
        refDate
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

export default router;
