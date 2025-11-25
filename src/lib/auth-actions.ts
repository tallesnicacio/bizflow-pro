'use server';

import { signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';
import { rateLimiter, RATE_LIMITS, RateLimitError } from './rate-limiter';
import { headers } from 'next/headers';

/**
 * Get client IP from headers for rate limiting
 */
function getClientIP(): string {
    const headersList = headers();

    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const cfConnectingIp = headersList.get('cf-connecting-ip');

    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }

    if (realIp) {
        return realIp;
    }

    if (cfConnectingIp) {
        return cfConnectingIp;
    }

    return 'unknown';
}

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    const email = formData.get('email') as string;
    const clientIP = getClientIP();

    // Rate limit by IP address to prevent brute force
    const ipIdentifier = `login:ip:${clientIP}`;
    const ipRateLimit = rateLimiter.check(
        ipIdentifier,
        RATE_LIMITS.LOGIN.limit,
        RATE_LIMITS.LOGIN.windowMs
    );

    if (!ipRateLimit.allowed) {
        return `Muitas tentativas de login. Tente novamente em ${ipRateLimit.retryAfter} segundos.`;
    }

    // Also rate limit by email if provided
    if (email) {
        const emailIdentifier = `login:email:${email.toLowerCase()}`;
        const emailRateLimit = rateLimiter.check(
            emailIdentifier,
            RATE_LIMITS.LOGIN.limit,
            RATE_LIMITS.LOGIN.windowMs
        );

        if (!emailRateLimit.allowed) {
            return `Muitas tentativas para este email. Tente novamente em ${emailRateLimit.retryAfter} segundos.`;
        }
    }

    try {
        await signIn('credentials', formData);

        // Reset rate limits on successful login
        rateLimiter.reset(ipIdentifier);
        if (email) {
            rateLimiter.reset(`login:email:${email.toLowerCase()}`);
        }
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Credenciais inválidas.';
                default:
                    return 'Algo deu errado.';
            }
        }
        throw error;
    }
}

export async function logout() {
    await signOut();
}
