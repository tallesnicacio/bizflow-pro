import twilio from 'twilio';
import { logger } from '../logger';

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const FROM_NUMBER = process.env.TWILIO_FROM_NUMBER;

let client: any = null;

if (ACCOUNT_SID && AUTH_TOKEN) {
    client = twilio(ACCOUNT_SID, AUTH_TOKEN);
}

export const smsService = {
    async sendSms(to: string, body: string) {
        if (!client || !FROM_NUMBER) {
            logger.info('[SMS Service] Simulation Mode: SMS not sent (no credentials configured)');
            return { success: true, simulated: true };
        }

        try {
            await client.messages.create({
                body,
                from: FROM_NUMBER,
                to,
            });
            logger.info('[SMS Service] SMS sent successfully');
            return { success: true, simulated: false };
        } catch (error) {
            logger.error('[SMS Service] Failed to send SMS', error);
            return { success: false, error };
        }
    }
};
