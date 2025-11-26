import dotenv from 'dotenv';
import path from 'path';

// Load .env FIRST before any other imports
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendSimpleEmail() {
    const recipient = process.argv[2] || 'talles.nicacio@gmail.com';

    console.log('📧 Enviando email simples...');
    console.log(`Destinatário: ${recipient}`);
    console.log(`API Key: ${process.env.RESEND_API_KEY?.substring(0, 10)}...\n`);

    try {
        const result = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: recipient,
            subject: '✅ Teste BizFlow Pro - Email Funcionando!',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #28a745;">✅ Sucesso!</h1>
                    <p>O serviço de email do BizFlow Pro está funcionando perfeitamente!</p>
                    <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
                    <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                    <p style="color: #666; font-size: 14px;">Email enviado via Resend API</p>
                </div>
            `,
        });

        if ('error' in result && result.error) {
            console.error('❌ Erro:', result.error);
            process.exit(1);
        }

        console.log('✅ Email enviado com sucesso!');
        console.log(`ID: ${result.data?.id}`);
        console.log(`\n📬 Verifique a caixa de entrada: ${recipient}`);
    } catch (error: any) {
        console.error('❌ Erro ao enviar:', error.message || error);
        process.exit(1);
    }
}

sendSimpleEmail();
