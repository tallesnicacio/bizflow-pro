import { resendService } from './resend-service';

export const emailService = {
    async sendEmail(to: string, subject: string, body: string, from?: string) {
        const fromAddress = from || process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

        return await resendService.sendEmail({
            from: fromAddress,
            to,
            subject,
            html: body,
            text: body.replace(/<[^>]*>/g, ''), // Strip HTML for text version
        });
    }
};
