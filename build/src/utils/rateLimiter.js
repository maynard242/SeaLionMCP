/**
 * Rate Limiter Utility
 *
 * Implements a simple sliding window rate limiter to prevent API abuse
 * and comply with Sea-lion API rate limits.
 */
export class RateLimiter {
    requests;
    maxRequests;
    windowMs;
    constructor(maxRequests = 10, windowMs = 60000) {
        this.requests = [];
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
    }
    /**
     * Check if a request is allowed under the rate limit
     */
    allowRequest() {
        const now = Date.now();
        // Remove old requests outside the time window
        this.cleanupOldRequests(now);
        // Check if we're under the limit
        if (this.requests.length < this.maxRequests) {
            // Add the current request
            this.requests.push({ timestamp: now });
            return true;
        }
        // Rate limit exceeded
        return false;
    }
    /**
     * Check if a request would be allowed without consuming it
     */
    wouldAllowRequest() {
        const now = Date.now();
        this.cleanupOldRequests(now);
        return this.requests.length < this.maxRequests;
    }
    /**
     * Remove requests older than the time window
     */
    cleanupOldRequests(currentTime) {
        const cutoff = currentTime - this.windowMs;
        this.requests = this.requests.filter(req => req.timestamp > cutoff);
    }
    /**
     * Get current request count in the window
     */
    getCurrentCount() {
        this.cleanupOldRequests(Date.now());
        return this.requests.length;
    }
    /**
     * Get remaining requests in the current window
     */
    getRemainingRequests() {
        return Math.max(0, this.maxRequests - this.getCurrentCount());
    }
    /**
     * Get time until the window resets (in milliseconds)
     */
    getTimeUntilReset() {
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
    reset() {
        this.requests = [];
    }
}
//# sourceMappingURL=rateLimiter.js.map