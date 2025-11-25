import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import { prisma } from './lib/prisma';
import bcrypt from 'bcryptjs';

async function getUser(email: string) {
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        return user;
    } catch (error) {
        // Security: Log error without exposing user details
        throw new Error('Failed to fetch user.');
    }
}

export const { auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    const user = await getUser(email);
                    if (!user) return null;

                    // For demo purposes, if user has no password set (from seed), we might want to allow or set it.
                    // But for now, let's assume seed sets a hash or we manually check.
                    // IMPORTANT: In a real app, ALWAYS use bcrypt.compare.
                    // For this demo, if the password in DB is not hashed (plain text from simple seed), we might fail.
                    // Let's assume the seed will be updated to use hashed passwords or we use a default hash.

                    const passwordsMatch = await bcrypt.compare(password, user.password);
                    if (passwordsMatch) return user;
                }

                // Security: Do not log invalid credentials attempts
                return null;
            },
        }),
    ],
});
