/**
 * Simple in-memory rate limiter using sliding window algorithm
 *
 * For production with multiple instances, consider using Redis/Upstash
 * This implementation is suitable for single-instance deployments
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
    requests: number[];
}

class RateLimiter {
    private store: Map<string, RateLimitEntry> = new Map();
    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor() {
        // Cleanup expired entries every 5 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 5 * 60 * 1000);
    }

    /**
     * Check if a request should be rate limited
     *
     * @param identifier - Unique identifier (IP, email, etc.)
     * @param limit - Maximum number of requests allowed
     * @param windowMs - Time window in milliseconds
     * @returns Object with allowed status and remaining attempts
     */
    check(identifier: string, limit: number, windowMs: number): {
        allowed: boolean;
        remaining: number;
        resetAt: number;
        retryAfter?: number;
    } {
        const now = Date.now();
        const key = identifier;

        // Get or create entry
        let entry = this.store.get(key);

        if (!entry) {
            entry = {
                count: 0,
                resetAt: now + windowMs,
                requests: [],
            };
            this.store.set(key, entry);
        }

        // Remove requests outside the current window (sliding window)
        const windowStart = now - windowMs;
        entry.requests = entry.requests.filter(timestamp => timestamp > windowStart);

        // Check if limit exceeded
        if (entry.requests.length >= limit) {
            const oldestRequest = Math.min(...entry.requests);
            const retryAfter = Math.ceil((oldestRequest + windowMs - now) / 1000);

            return {
                allowed: false,
                remaining: 0,
                resetAt: oldestRequest + windowMs,
                retryAfter: Math.max(1, retryAfter),
            };
        }

        // Add current request
        entry.requests.push(now);
        entry.count = entry.requests.length;

        return {
            allowed: true,
            remaining: limit - entry.requests.length,
            resetAt: entry.requests[0] + windowMs,
        };
    }

    /**
     * Reset rate limit for a specific identifier
     */
    reset(identifier: string): void {
        this.store.delete(identifier);
    }

    /**
     * Clean up expired entries
     */
    private cleanup(): void {
        const now = Date.now();

        for (const [key, entry] of this.store.entries()) {
            // Remove entries with no recent requests
            const windowStart = now - (60 * 60 * 1000); // 1 hour
            entry.requests = entry.requests.filter(timestamp => timestamp > windowStart);

            if (entry.requests.length === 0) {
                this.store.delete(key);
            }
        }
    }

    /**
     * Get current stats (for monitoring)
     */
    getStats(): { totalKeys: number; totalRequests: number } {
        let totalRequests = 0;

        for (const entry of this.store.values()) {
            totalRequests += entry.requests.length;
        }

        return {
            totalKeys: this.store.size,
            totalRequests,
        };
    }

    /**
     * Clear all rate limit data
     */
    clear(): void {
        this.store.clear();
    }

    /**
     * Destroy the rate limiter (cleanup interval)
     */
    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.clear();
    }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Rate limit configurations
 */
export const RATE_LIMITS = {
    // Login attempts: 5 attempts per 15 minutes per IP/email
    LOGIN: {
        limit: 5,
        windowMs: 15 * 60 * 1000, // 15 minutes
    },

    // Public form submissions: 10 per hour per IP
    FORM_SUBMISSION: {
        limit: 10,
        windowMs: 60 * 60 * 1000, // 1 hour
    },

    // API calls: 100 per minute per user
    API: {
        limit: 100,
        windowMs: 60 * 1000, // 1 minute
    },

    // Password reset: 3 attempts per hour per email
    PASSWORD_RESET: {
        limit: 3,
        windowMs: 60 * 60 * 1000, // 1 hour
    },
} as const;

/**
 * Helper to get client identifier (IP address)
 * Works with Next.js headers
 */
export function getClientIdentifier(headers: Headers): string {
    // Try to get real IP from common proxy headers
    const forwardedFor = headers.get('x-forwarded-for');
    const realIp = headers.get('x-real-ip');
    const cfConnectingIp = headers.get('cf-connecting-ip'); // Cloudflare

    if (forwardedFor) {
        // x-forwarded-for may contain multiple IPs, get the first one
        return forwardedFor.split(',')[0].trim();
    }

    if (realIp) {
        return realIp;
    }

    if (cfConnectingIp) {
        return cfConnectingIp;
    }

    // Fallback to 'unknown' if no IP found
    return 'unknown';
}

/**
 * Rate limit error class
 */
export class RateLimitError extends Error {
    constructor(
        message: string,
        public retryAfter: number,
        public resetAt: number
    ) {
        super(message);
        this.name = 'RateLimitError';
    }
}
