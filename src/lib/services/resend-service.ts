import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY || 'mock_key');

interface SendEmailParams {
    from: string;
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
}

export const resendService = {
    async sendEmail({ from, to, subject, html, text }: SendEmailParams) {
        try {
            if (!process.env.RESEND_API_KEY) {
                console.log('[Resend] No API key configured, simulating email send');
                console.log(`[Resend] From: ${from}`);
                console.log(`[Resend] To: ${to}`);
                console.log(`[Resend] Subject: ${subject}`);
                return { success: true, simulated: true };
            }

            const { data, error } = await resend.emails.send({
                from,
                to,
                subject,
                html,
                text,
            });

            if (error) {
                console.error('[Resend] Error sending email:', error);
                return { success: false, error: error.message };
            }

            console.log('[Resend] Email sent successfully:', data?.id);
            return { success: true, data };
        } catch (error: any) {
            console.error('[Resend] Error sending email:', error);
            return { success: false, error: error.message };
        }
    },

    async sendBulkEmail(emails: SendEmailParams[]) {
        try {
            if (!process.env.RESEND_API_KEY) {
                console.log('[Resend] No API key configured, simulating bulk email send');
                console.log(`[Resend] Sending ${emails.length} emails`);
                return { success: true, simulated: true };
            }

            const { data, error } = await resend.batch.send(emails);

            if (error) {
                console.error('[Resend] Error sending bulk emails:', error);
                return { success: false, error: error.message };
            }

            console.log('[Resend] Bulk emails sent successfully');
            return { success: true, data };
        } catch (error: any) {
            console.error('[Resend] Error sending bulk emails:', error);
            return { success: false, error: error.message };
        }
    },

    async addDomain(domain: string) {
        try {
            if (!process.env.RESEND_API_KEY) {
                console.log('[Resend] No API key configured, simulating domain add');
                return {
                    success: true,
                    simulated: true,
                    dnsRecords: {
                        dkim: 'resend._domainkey.yourcompany.com TXT "v=DKIM1; k=rsa; p=..."',
                        spf: 'yourcompany.com TXT "v=spf1 include:_spf.resend.com ~all"',
                        dmarc: '_dmarc.yourcompany.com TXT "v=DMARC1; p=none; rua=mailto:dmarc@yourcompany.com"'
                    }
                };
            }

            const { data, error } = await resend.domains.create({ name: domain });

            if (error) {
                console.error('[Resend] Error adding domain:', error);
                return { success: false, error: error.message };
            }

            return {
                success: true,
                domainId: data?.id,
                dnsRecords: data?.records,
            };
        } catch (error: any) {
            console.error('[Resend] Error adding domain:', error);
            return { success: false, error: error.message };
        }
    },

    async verifyDomain(domainId: string) {
        try {
            if (!process.env.RESEND_API_KEY) {
                console.log('[Resend] No API key configured, simulating domain verification');
                return { success: true, simulated: true, verified: true };
            }

            const result = await resend.domains.verify(domainId);

            if (result.error) {
                console.error('[Resend] Error verifying domain:', result.error);
                return { success: false, error: result.error.message };
            }

            // Type assertion since Resend types don't match actual API response
            const domainData = result.data as any;
            const verified = domainData?.status === 'verified';

            return {
                success: true,
                verified,
                status: domainData?.status || 'unknown',
            };
        } catch (error: any) {
            console.error('[Resend] Error verifying domain:', error);
            return { success: false, error: error.message };
        }
    },
};
