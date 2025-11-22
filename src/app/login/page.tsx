'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { authenticate } from '@/lib/auth-actions';
import { ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const [errorMessage, dispatch] = useActionState(authenticate, undefined);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20">
            <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-xl border border-border shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight">BizFlow Pro</h1>
                    <p className="text-muted-foreground mt-2">Entre na sua conta</p>
                </div>

                <form action={dispatch} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-2" htmlFor="email">
                            Email
                        </label>
                        <input
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                            id="email"
                            type="email"
                            name="email"
                            placeholder="admin@bizflow.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2" htmlFor="password">
                            Senha
                        </label>
                        <input
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                            id="password"
                            type="password"
                            name="password"
                            placeholder="••••••"
                            required
                            minLength={6}
                        />
                    </div>

                    {errorMessage && (
                        <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
                            {errorMessage}
                        </div>
                    )}

                    <LoginButton />
                </form>

                <div className="text-center text-sm text-muted-foreground">
                    <p>Demo: admin@bizflow.com / 123456</p>
                </div>
            </div>
        </div>
    );
}

function LoginButton() {
    const { pending } = useFormStatus();

    return (
        <button
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 font-medium disabled:opacity-50"
            aria-disabled={pending}
            disabled={pending}
        >
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Entrar'}
            {!pending && <ArrowRight className="w-4 h-4" />}
        </button>
    );
}
