import dotenv from 'dotenv';
import path from 'path';

// MUST load env before any other imports
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

console.log('Env loaded. API Key:', process.env.RESEND_API_KEY?.substring(0, 15) + '...');

// Now import after env is loaded
const { sendWelcomeEmail } = require('../src/lib/services/email-helpers');

const recipient = process.argv[2] || 'talles.nicacio@gmail.com';

async function test() {
    console.log(`\n📧 Enviando para: ${recipient}\n`);

    const result = await sendWelcomeEmail(recipient, {
        userName: 'Talles Nicácio',
        companyName: 'BizFlow Pro',
        loginUrl: 'https://bizflow-pro.example.com/login',
    });

    if (result.success) {
        console.log('✅ Email enviado com sucesso!');
        if ('data' in result) {
            console.log(`ID: ${result.data?.id}`);
        }
    } else {
        console.error('❌ Erro:', result.error);
        process.exit(1);
    }
}

test();
