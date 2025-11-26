/**
 * Resend API Key Verification Script
 * Verifies if the API key is valid and displays account information
 */

import dotenv from 'dotenv';
import path from 'path';
import { Resend } from 'resend';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const API_KEY = process.env.RESEND_API_KEY;

if (!API_KEY) {
    console.error('❌ RESEND_API_KEY não encontrada no .env');
    process.exit(1);
}

console.log('🔍 Verificando API Key do Resend...\n');
console.log(`🔑 API Key: ${API_KEY.substring(0, 10)}...${API_KEY.substring(API_KEY.length - 4)}\n`);

const resend = new Resend(API_KEY);

async function verifyApiKey() {
    try {
        // Test 1: List API Keys
        console.log('📋 Teste 1: Listando API Keys...');
        const keysResult = await resend.apiKeys.list();

        if ('error' in keysResult && keysResult.error) {
            console.error('❌ Erro ao listar API keys:', keysResult.error);
            return false;
        }

        console.log('✅ API Key válida!');
        if ('data' in keysResult && keysResult.data) {
            const keys = Array.isArray(keysResult.data) ? keysResult.data : [keysResult.data];
            console.log(`   Total de keys: ${keys.length}`);
            keys.forEach((key: any, index: number) => {
                if (key && typeof key === 'object') {
                    console.log(`   ${index + 1}. ${key.name || 'Unnamed'} (ID: ${key.id || 'N/A'})`);
                    if (key.created_at) {
                        console.log(`      Criada em: ${new Date(key.created_at).toLocaleString('pt-BR')}`);
                    }
                }
            });
        }
        console.log();

        // Test 2: List Domains
        console.log('🌐 Teste 2: Listando domínios...');
        const domainsResult = await resend.domains.list();

        if ('error' in domainsResult && domainsResult.error) {
            console.log('⚠️  Não foi possível listar domínios:', domainsResult.error);
        } else if ('data' in domainsResult && domainsResult.data) {
            const domains = Array.isArray(domainsResult.data) ? domainsResult.data : [domainsResult.data];
            if (domains.length === 0 || !domains[0]) {
                console.log('ℹ️  Nenhum domínio configurado ainda');
                console.log('   Você pode usar: onboarding@resend.dev para testes\n');
            } else {
                console.log(`✅ Domínios encontrados: ${domains.length}`);
                domains.forEach((domain: any, index: number) => {
                    if (domain && typeof domain === 'object') {
                        console.log(`   ${index + 1}. ${domain.name || 'N/A'}`);
                        console.log(`      Status: ${domain.status || 'N/A'}`);
                        console.log(`      Região: ${domain.region || 'N/A'}`);
                    }
                });
                console.log();
            }
        }

        // Test 3: Try sending a test email (optional)
        console.log('📧 Teste 3: Enviando email de teste...');
        const testEmail = process.argv[2];

        if (testEmail) {
            console.log(`   Destinatário: ${testEmail}`);
            const emailResult = await resend.emails.send({
                from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
                to: testEmail,
                subject: '✅ Verificação de API Key - BizFlow Pro',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h1 style="color: #28a745;">✅ API Key Verificada com Sucesso!</h1>
                        <p>Sua API key do Resend está configurada corretamente no BizFlow Pro.</p>
                        <p><strong>Data do teste:</strong> ${new Date().toLocaleString('pt-BR')}</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="color: #666; font-size: 14px;">Este é um email automático de teste.</p>
                    </div>
                `,
            });

            if ('error' in emailResult && emailResult.error) {
                console.error('❌ Erro ao enviar email:', emailResult.error);
            } else if ('data' in emailResult && emailResult.data) {
                console.log('✅ Email de teste enviado com sucesso!');
                console.log(`   ID: ${emailResult.data.id}\n`);
            }
        } else {
            console.log('ℹ️  Pule o envio de email (adicione um email como argumento para testar)');
            console.log(`   Exemplo: npx tsx scripts/verify-resend-key.ts seu@email.com\n`);
        }

        console.log('🎉 Verificação concluída com sucesso!');
        console.log('\n📚 Configuração atual:');
        console.log(`   RESEND_API_KEY: ${API_KEY.substring(0, 10)}...${API_KEY.substring(API_KEY.length - 4)}`);
        console.log(`   RESEND_FROM_EMAIL: ${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}`);

        return true;
    } catch (error: any) {
        console.error('\n❌ Erro inesperado:', error.message || error);
        return false;
    }
}

verifyApiKey()
    .then((success) => {
        process.exit(success ? 0 : 1);
    })
    .catch((error) => {
        console.error('❌ Erro fatal:', error);
        process.exit(1);
    });
