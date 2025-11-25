import sgMail from '@sendgrid/mail';
import { logger } from '../logger';

const API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@bizflow.com';

if (API_KEY) {
    sgMail.setApiKey(API_KEY);
}

export const emailService = {
    async sendEmail(to: string, subject: string, html: string) {
        if (!API_KEY) {
            logger.info('[Email Service] Simulation Mode: Email not sent (no API key configured)');
            return { success: true, simulated: true };
        }

        try {
            await sgMail.send({
                to,
                from: FROM_EMAIL,
                subject,
                html,
            });
            logger.info('[Email Service] Email sent successfully');
            return { success: true, simulated: false };
        } catch (error) {
            logger.error('[Email Service] Failed to send email', error);
            return { success: false, error };
        }
    }
};
