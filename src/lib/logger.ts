/**
 * Safe logger utility
 * - Only logs in development mode by default
 * - Never logs sensitive data
 * - Can be controlled via DEBUG environment variable
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isDebugEnabled = process.env.DEBUG === 'true' || isDevelopment;

export const logger = {
    /**
     * Log general information (only in development)
     */
    info: (...args: any[]) => {
        if (isDebugEnabled) {
            console.log('[INFO]', ...args);
        }
    },

    /**
     * Log warnings (always logged)
     */
    warn: (...args: any[]) => {
        console.warn('[WARN]', ...args);
    },

    /**
     * Log errors (always logged, but sanitized)
     */
    error: (message: string, error?: any) => {
        if (isDevelopment) {
            console.error('[ERROR]', message, error);
        } else {
            // In production, only log the message, not the full error object
            console.error('[ERROR]', message);
        }
    },

    /**
     * Log debug information (only when DEBUG=true)
     */
    debug: (...args: any[]) => {
        if (process.env.DEBUG === 'true') {
            console.log('[DEBUG]', ...args);
        }
    },

    /**
     * Log workflow execution (controlled by WORKFLOW_DEBUG)
     */
    workflow: (message: string, data?: any) => {
        if (process.env.WORKFLOW_DEBUG === 'true') {
            console.log('[WORKFLOW]', message, data ? JSON.stringify(data, null, 2) : '');
        }
    },
};

/**
 * Sanitize sensitive data from objects
 * Removes fields like password, token, secret, etc.
 */
export function sanitize<T extends Record<string, any>>(obj: T): Partial<T> {
    const sensitiveFields = [
        'password',
        'token',
        'secret',
        'apiKey',
        'accessToken',
        'refreshToken',
        'privateKey',
        'credential',
    ];

    const sanitized: any = { ...obj };

    for (const key of Object.keys(sanitized)) {
        const lowerKey = key.toLowerCase();
        if (sensitiveFields.some(field => lowerKey.includes(field))) {
            sanitized[key] = '[REDACTED]';
        } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
            sanitized[key] = sanitize(sanitized[key]);
        }
    }

    return sanitized;
}
