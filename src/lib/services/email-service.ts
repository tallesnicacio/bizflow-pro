import sgMail from '@sendgrid/mail';

const API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@bizflow.com';

if (API_KEY) {
    sgMail.setApiKey(API_KEY);
}

export const emailService = {
    async sendEmail(to: string, subject: string, html: string) {
        if (!API_KEY) {
            console.log(`[Email Service] Simulation Mode: Sending email to ${to}`);
            console.log(`Subject: ${subject}`);
            console.log(`Content: ${html.substring(0, 50)}...`);
            return { success: true, simulated: true };
        }

        try {
            await sgMail.send({
                to,
                from: FROM_EMAIL,
                subject,
                html,
            });
            console.log(`[Email Service] Email sent to ${to}`);
            return { success: true, simulated: false };
        } catch (error) {
            console.error('[Email Service] Error sending email:', error);
            return { success: false, error };
        }
    }
};
