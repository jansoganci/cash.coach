import rateLimit from 'express-rate-limit';

/**
 * Rate limiter middleware for login endpoint
 * Limits login attempts to prevent brute force attacks
 * 
 * Configuration:
 * - 5 requests per IP in a 15-minute window
 * - Returns standardized rate limit headers
 * - Custom error message for rate limit exceeded
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per IP in the window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { message: "Too many login attempts, please try again later." }
});
