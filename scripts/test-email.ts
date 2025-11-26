/**
 * Email Test Script
 * Run this script to test the email service configuration
 *
 * Usage: npx tsx scripts/test-email.ts <email@example.com>
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { resendService } from '../src/lib/services/resend-service';
import { emailTemplates } from '../src/lib/services/email-templates';

const recipientEmail = process.argv[2];

if (!recipientEmail) {
    console.error('❌ Por favor, forneça um email destinatário');
    console.log('Uso: npx tsx scripts/test-email.ts <email@example.com>');
    process.exit(1);
}

async function testEmail() {
    console.log('🧪 Testando serviço de email Resend...\n');
    console.log(`📧 Destinatário: ${recipientEmail}`);
    console.log(`🔑 API Key configurada: ${process.env.RESEND_API_KEY ? 'Sim ✓' : 'Não ✗'}\n`);

    if (!process.env.RESEND_API_KEY) {
        console.error('❌ RESEND_API_KEY não configurada no arquivo .env');
        process.exit(1);
    }

    // Test 1: Simple email
    console.log('📨 Teste 1: Email simples...');
    const result1 = await resendService.sendEmail({
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: recipientEmail,
        subject: '🧪 Teste do BizFlow Pro - Email Simples',
        html: `
            <h1>Teste de Email</h1>
            <p>Este é um email de teste do serviço Resend no BizFlow Pro.</p>
            <p>Se você está vendo isso, o serviço está funcionando corretamente! ✅</p>
        `,
        text: 'Este é um email de teste do serviço Resend no BizFlow Pro.',
    });

    if (result1.success) {
        console.log('✅ Email simples enviado com sucesso!');
        console.log(`   ID: ${result1.data?.id}\n`);
    } else {
        console.error('❌ Erro ao enviar email simples:', result1.error);
        process.exit(1);
    }

    // Test 2: Welcome email template
    console.log('📨 Teste 2: Template de boas-vindas...');
    const welcomeHtml = emailTemplates.welcome({
        userName: 'Usuário Teste',
        companyName: 'BizFlow Pro',
        loginUrl: 'https://bizflow-pro.example.com/login',
    });

    const result2 = await resendService.sendEmail({
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: recipientEmail,
        subject: '🎉 Bem-vindo ao BizFlow Pro!',
        html: welcomeHtml,
        text: 'Bem-vindo ao BizFlow Pro! Sua conta foi criada com sucesso.',
    });

    if (result2.success) {
        console.log('✅ Email de boas-vindas enviado com sucesso!');
        console.log(`   ID: ${result2.data?.id}\n`);
    } else {
        console.error('❌ Erro ao enviar email de boas-vindas:', result2.error);
        process.exit(1);
    }

    // Test 3: New lead notification template
    console.log('📨 Teste 3: Template de notificação de lead...');
    const newLeadHtml = emailTemplates.newLead({
        leadName: 'João Silva',
        leadEmail: 'joao@example.com',
        formName: 'Formulário de Contato',
        submissionData: {
            'Nome': 'João Silva',
            'Email': 'joao@example.com',
            'Telefone': '(11) 98765-4321',
            'Empresa': 'Empresa Exemplo Ltda',
            'Mensagem': 'Gostaria de saber mais sobre os produtos',
        },
        viewUrl: 'https://bizflow-pro.example.com/crm/leads/123',
    });

    const result3 = await resendService.sendEmail({
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: recipientEmail,
        subject: '🎯 Novo Lead: João Silva',
        html: newLeadHtml,
        text: 'Um novo lead foi capturado: João Silva',
    });

    if (result3.success) {
        console.log('✅ Email de novo lead enviado com sucesso!');
        console.log(`   ID: ${result3.data?.id}\n`);
    } else {
        console.error('❌ Erro ao enviar email de novo lead:', result3.error);
        process.exit(1);
    }

    console.log('🎉 Todos os testes passaram com sucesso!');
    console.log('\n📬 Verifique sua caixa de entrada em:', recipientEmail);
}

testEmail().catch((error) => {
    console.error('❌ Erro no teste:', error);
    process.exit(1);
});
