import twilio from 'twilio';

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
            console.log(`[SMS Service] Simulation Mode: Sending SMS to ${to}`);
            console.log(`Message: ${body}`);
            return { success: true, simulated: true };
        }

        try {
            await client.messages.create({
                body,
                from: FROM_NUMBER,
                to,
            });
            console.log(`[SMS Service] SMS sent to ${to}`);
            return { success: true, simulated: false };
        } catch (error) {
            console.error('[SMS Service] Error sending SMS:', error);
            return { success: false, error };
        }
    }
};
