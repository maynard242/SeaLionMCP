/**
 * Rate Limiter Utility
 * 
 * Implements a simple sliding window rate limiter to prevent API abuse
 * and comply with Sea-lion API rate limits.
 */

interface RequestRecord {
  timestamp: number;
}

export class RateLimiter {
  private requests: RequestRecord[];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.requests = [];
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if a request is allowed under the rate limit
   */
  allowRequest(): boolean {
    const now = Date.now();
    
    // Remove old requests outside the time window
    this.cleanupOldRequests(now);
    
    // Check if we're under the limit
    if (this.requests.length < this.maxRequests) {
      // Add the current request
      this.requests.push({ timestamp: now });
      return true;
    }
    
    return false;
  }

  /**
   * Remove requests older than the time window
   */
  private cleanupOldRequests(currentTime: number): void {
    const cutoff = currentTime - this.windowMs;
    this.requests = this.requests.filter(req => req.timestamp > cutoff);
  }

  /**
   * Get current request count in the window
   */
  getCurrentCount(): number {
    this.cleanupOldRequests(Date.now());
    return this.requests.length;
  }

  /**
   * Get remaining requests in the current window
   */
  getRemainingRequests(): number {
    return Math.max(0, this.maxRequests - this.getCurrentCount());
  }

  /**
   * Get time until the window resets (in milliseconds)
   */
  getTimeUntilReset(): number {
    if (this.requests.length === 0) {
      return 0;
    }
    
    const oldestRequest = Math.min(...this.requests.map(req => req.timestamp));
    const resetTime = oldestRequest + this.windowMs;
    return Math.max(0, resetTime - Date.now());
  }

  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.requests = [];
  }
}
