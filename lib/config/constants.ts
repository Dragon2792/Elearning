/**
 * Application configuration constants
 * Centralized place for all hardcoded values
 */

export const CONFIG = {
  // Grading thresholds
  PASSING_SCORE: 70,

  // Exam constraints
  MAX_EXAM_ATTEMPTS: 2,

  // Code execution limits
  MAX_CODE_OUTPUT_SIZE: 2048,
  CODE_EXECUTION_TIMEOUT_MS: 10000,

  // Rate limiting
  RATE_LIMIT: {
    CHAT: { requests: 20, windowMs: 60000 }, // 20 requests per minute
    GRADE: { requests: 10, windowMs: 60000 }, // 10 requests per minute
    RUN_CODE: { requests: 5, windowMs: 60000 }, // 5 requests per minute
  },

  // Pagination
  DEFAULT_PAGE_SIZE: 10,

  // Module system
  MAX_FILE_SIZE: 52428800, // 50 MB
  ALLOWED_FILE_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ],
} as const;
