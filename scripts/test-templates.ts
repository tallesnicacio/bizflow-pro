import dotenv from 'dotenv';
import path from 'path';

// Load environment variables first
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import {
    sendWelcomeEmail,
    sendNewLeadNotification,
    sendOpportunityStageChangeNotification,
    sendFormSubmissionConfirmation,
} from '../src/lib/services/email-helpers';

const recipient = process.argv[2];

if (!recipient) {
    console.error('❌ Forneça um email destinatário');
    console.log('Uso: npx tsx scripts/test-templates.ts <email@example.com>');
    process.exit(1);
}

async function testTemplates() {
    console.log('🎨 Testando templates de email...\n');
    console.log(`📧 Destinatário: ${recipient}\n`);

    // Aguardar entre os envios para evitar rate limit
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Test 1: Welcome Email
    console.log('📨 1/4: Enviando email de boas-vindas...');
    const result1 = await sendWelcomeEmail(recipient, {
        userName: 'Talles Nicácio',
        companyName: 'BizFlow Pro',
        loginUrl: 'https://bizflow-pro.example.com/login',
    });

    if (result1.success) {
        console.log('✅ Boas-vindas enviado!');
        if ('data' in result1 && result1.data) {
            console.log(`   ID: ${result1.data.id}`);
        }
    } else {
        console.error('❌ Erro:', result1.error);
    }

    await wait(2000);

    // Test 2: New Lead Notification
    console.log('\n📨 2/4: Enviando notificação de novo lead...');
    const result2 = await sendNewLeadNotification(recipient, {
        leadName: 'João Silva',
        leadEmail: 'joao.silva@example.com',
        formName: 'Formulário de Contato',
        submissionData: {
            'Nome Completo': 'João Silva',
            'Email': 'joao.silva@example.com',
            'Telefone': '(11) 98765-4321',
            'Empresa': 'Tech Solutions Ltda',
            'Interesse': 'Plano Enterprise',
            'Mensagem': 'Gostaria de agendar uma demonstração do produto para minha equipe.',
        },
        viewUrl: 'https://bizflow-pro.example.com/crm/leads/123',
    });

    if (result2.success) {
        console.log('✅ Notificação de lead enviada!');
        if ('data' in result2 && result2.data) {
            console.log(`   ID: ${result2.data.id}`);
        }
    } else {
        console.error('❌ Erro:', result2.error);
    }

    await wait(2000);

    // Test 3: Opportunity Stage Change
    console.log('\n📨 3/4: Enviando notificação de mudança de estágio...');
    const result3 = await sendOpportunityStageChangeNotification(recipient, {
        opportunityTitle: 'Venda Tech Solutions - Plano Enterprise',
        oldStage: 'Proposta Enviada',
        newStage: 'Negociação',
        contactName: 'João Silva',
        value: 25000.00,
        viewUrl: 'https://bizflow-pro.example.com/crm/opportunities/456',
    });

    if (result3.success) {
        console.log('✅ Notificação de mudança enviada!');
        if ('data' in result3 && result3.data) {
            console.log(`   ID: ${result3.data.id}`);
        }
    } else {
        console.error('❌ Erro:', result3.error);
    }

    await wait(2000);

    // Test 4: Form Submission Confirmation
    console.log('\n📨 4/4: Enviando confirmação de formulário...');
    const result4 = await sendFormSubmissionConfirmation(recipient, {
        contactName: 'Talles Nicácio',
        formName: 'Contato para Demonstração',
        message: 'Recebemos sua solicitação! Nossa equipe de vendas entrará em contato em até 24 horas para agendar uma demonstração personalizada do BizFlow Pro.',
    });

    if (result4.success) {
        console.log('✅ Confirmação enviada!');
        if ('data' in result4 && result4.data) {
            console.log(`   ID: ${result4.data.id}`);
        }
    } else {
        console.error('❌ Erro:', result4.error);
    }

    console.log('\n🎉 Teste de templates concluído!');
    console.log(`📬 Verifique sua caixa de entrada: ${recipient}`);
    console.log('\n💡 Você deve ter recebido 4 emails diferentes com templates profissionais.');
}

testTemplates().catch((error) => {
    console.error('❌ Erro no teste:', error);
    process.exit(1);
});
