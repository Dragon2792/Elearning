/**
 * Simple in-memory rate limiter for API endpoints
 * In production, use Redis for distributed rate limiting
 */

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

const store: RateLimitStore = {};

export function createRateLimiter(
  windowMs: number = 60000,
  maxRequests: number = 10,
) {
  return (identifier: string): boolean => {
    const now = Date.now();
    const key = identifier;

    if (!store[key]) {
      store[key] = { count: 1, resetTime: now + windowMs };
      return true;
    }

    if (now > store[key].resetTime) {
      store[key] = { count: 1, resetTime: now + windowMs };
      return true;
    }

    store[key].count++;
    return store[key].count <= maxRequests;
  };
}

export function getClientIdentifier(request: Request): string {
  // Try to get user ID from auth token, fall back to IP
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    return authHeader.substring(0, 50);
  }

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0] || "unknown";
  return ip;
}
