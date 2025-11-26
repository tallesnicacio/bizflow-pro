'use client';

import { CheckCircle, Circle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface OnboardingStepProps {
    title: string;
    description: string;
    href: string;
    isCompleted: boolean;
    icon?: React.ReactNode;
}

export function OnboardingStep({ title, description, href, isCompleted, icon }: OnboardingStepProps) {
    return (
        <Link
            href={href}
            className={cn(
                "flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 group",
                isCompleted
                    ? "bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50"
                    : "bg-card border-border hover:border-primary/50 hover:shadow-sm"
            )}
        >
            <div className={cn(
                "mt-1 shrink-0 transition-colors",
                isCompleted ? "text-emerald-500" : "text-muted-foreground group-hover:text-primary"
            )}>
                {isCompleted ? <CheckCircle size={24} /> : <Circle size={24} />}
            </div>

            <div className="flex-1">
                <h3 className={cn(
                    "font-medium mb-1 transition-colors",
                    isCompleted ? "text-emerald-900" : "text-foreground group-hover:text-primary"
                )}>
                    {title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {description}
                </p>
            </div>

            {icon && (
                <div className="text-muted-foreground/20 group-hover:text-primary/20 transition-colors">
                    {icon}
                </div>
            )}

            {!isCompleted && (
                <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity text-primary">
                    <ArrowRight size={20} />
                </div>
            )}
        </Link>
    );
}
