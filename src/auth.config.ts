import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = !nextUrl.pathname.startsWith('/login') && !nextUrl.pathname.startsWith('/_next') && !nextUrl.pathname.startsWith('/static');

            // Allow public assets and login page
            if (nextUrl.pathname.startsWith('/_next') || nextUrl.pathname.startsWith('/static') || nextUrl.pathname === '/login') {
                return true;
            }

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn) {
                return Response.redirect(new URL('/', nextUrl));
            }
            return true;
        },
        async session({ session, token }: any) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
                session.user.tenantId = token.tenantId;
            }
            return session;
        },
        async jwt({ token, user }: any) {
            if (user) {
                token.tenantId = user.tenantId;
            }
            return token;
        }
    },
    providers: [], // Configured in auth.ts
} satisfies NextAuthConfig;
