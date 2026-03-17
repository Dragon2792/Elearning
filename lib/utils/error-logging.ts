/**
 * Error logging and tracking utility
 * Can be extended to integrate with services like Sentry, LogRocket, etc
 */

export interface ErrorLog {
  message: string;
  error: Error | string;
  context?: Record<string, any>;
  timestamp: string;
  url?: string;
  userAgent?: string;
}

const ERROR_LOGS: ErrorLog[] = [];
const MAX_LOGS = 100;

export function logError(
  message: string,
  error: Error | string,
  context?: Record<string, any>,
): void {
  const log: ErrorLog = {
    message,
    error: error instanceof Error ? error.message : error,
    context,
    timestamp: new Date().toISOString(),
    url: typeof window !== "undefined" ? window.location.href : undefined,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
  };

  ERROR_LOGS.push(log);

  // Keep only last 100 errors in memory
  if (ERROR_LOGS.length > MAX_LOGS) {
    ERROR_LOGS.shift();
  }

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.error(`[${message}]`, error, context);
  }

  // TODO: Send to error tracking service
  // sendToErrorTrackingService(log);
}

export function getErrorLogs(): ErrorLog[] {
  return [...ERROR_LOGS];
}

export function clearErrorLogs(): void {
  ERROR_LOGS.length = 0;
}

/**
 * Wrap async functions to automatically log errors
 */
export function withErrorLogging<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  errorMessage: string,
) {
  return async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(errorMessage, error as Error | string, {
        args: args.length > 0 ? String(args[0]).substring(0, 100) : undefined,
      });
      return null;
    }
  };
}
