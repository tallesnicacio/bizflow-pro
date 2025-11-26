'use server';

import { auth } from '@/auth';

/**
 * Unauthorized error for better error handling
 */
export class UnauthorizedError extends Error {
    constructor(message = 'Unauthorized') {
        super(message);
        this.name = 'UnauthorizedError';
    }
}

/**
 * Forbidden error when tenant doesn't match
 */
export class ForbiddenError extends Error {
    constructor(message = 'Access forbidden') {
        super(message);
        this.name = 'ForbiddenError';
    }
}

/**
 * Get authenticated session with tenant validation
 * Throws if user is not authenticated
 */
export async function requireAuth() {
    const session = await auth();

    if (!session?.user) {
        throw new UnauthorizedError('Authentication required');
    }

    if (!session.user.tenantId) {
        throw new UnauthorizedError('Invalid session: missing tenant');
    }

    return {
        user: session.user,
        tenantId: session.user.tenantId,
    };
}

/**
 * Get tenant ID from authenticated session
 * Returns null if not authenticated (for optional auth)
 */
export async function getOptionalAuth() {
    const session = await auth();

    if (!session?.user?.tenantId) {
        return null;
    }

    return {
        user: session.user,
        tenantId: session.user.tenantId,
    };
}

/**
 * Validate that a resource belongs to the authenticated user's tenant
 * Throws ForbiddenError if tenant doesn't match
 */
export function validateTenantAccess(resourceTenantId: string, userTenantId: string) {
    if (resourceTenantId !== userTenantId) {
        throw new ForbiddenError('You do not have access to this resource');
    }
}
