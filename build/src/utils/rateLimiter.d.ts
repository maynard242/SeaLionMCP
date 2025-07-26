/**
 * Rate Limiter Utility
 *
 * Implements a simple sliding window rate limiter to prevent API abuse
 * and comply with Sea-lion API rate limits.
 */
export declare class RateLimiter {
    private requests;
    private maxRequests;
    private windowMs;
    constructor(maxRequests?: number, windowMs?: number);
    /**
     * Check if a request is allowed under the rate limit
     */
    allowRequest(): boolean;
    /**
     * Check if a request would be allowed without consuming it
     */
    wouldAllowRequest(): boolean;
    /**
     * Remove requests older than the time window
     */
    private cleanupOldRequests;
    /**
     * Get current request count in the window
     */
    getCurrentCount(): number;
    /**
     * Get remaining requests in the current window
     */
    getRemainingRequests(): number;
    /**
     * Get time until the window resets (in milliseconds)
     */
    getTimeUntilReset(): number;
    /**
     * Reset the rate limiter
     */
    reset(): void;
}
//# sourceMappingURL=rateLimiter.d.ts.map