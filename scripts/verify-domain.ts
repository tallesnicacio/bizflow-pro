import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { resendService } from '../src/lib/services/resend-service';

const domainId = process.argv[2];

if (!domainId) {
    console.error('❌ Por favor, forneça o ID do domínio');
    console.log('Uso: npx tsx scripts/verify-domain.ts <domain-id>');
    console.log('Exemplo: npx tsx scripts/verify-domain.ts ad911651-3966-4fd1-983f-082495c5e9f9');
    process.exit(1);
}

async function verifyDomain() {
    console.log(`🔍 Verificando domínio: ${domainId}\n`);

    const result = await resendService.verifyDomain(domainId);

    if (!result.success) {
        console.error('❌ Erro ao verificar domínio:', result.error);
        process.exit(1);
    }

    if (result.simulated) {
        console.log('⚠️  Modo de simulação - API key não configurada');
        console.log(result);
        return;
    }

    console.log('📊 Status da Verificação:\n');
    console.log(`Status: ${result.status}`);
    console.log(`Verificado: ${result.verified ? '✅ SIM' : '❌ NÃO'}\n`);

    if (result.verified) {
        console.log('🎉 Domínio verificado com sucesso!');
        console.log('\n✅ Seu domínio está pronto para enviar emails!');
        console.log('\n📝 Próximo passo:');
        console.log('Atualize o .env com seu email personalizado:');
        console.log('RESEND_FROM_EMAIL=noreply@mail.buildmkt.com.br');
        console.log('\n📧 Teste o envio:');
        console.log('npx tsx scripts/simple-email-test.ts seu@email.com');
    } else {
        console.log('⏳ Domínio ainda não verificado.');
        console.log('\n💡 Possíveis causas:');
        console.log('1. Registros DNS ainda não foram adicionados');
        console.log('2. Propagação DNS em andamento (aguarde 15-30 minutos)');
        console.log('3. Registros DNS configurados incorretamente');
        console.log('\n🔧 O que fazer:');
        console.log('1. Confirme que adicionou todos os registros DNS');
        console.log('2. Verifique se não há erros de digitação nos registros');
        console.log('3. Aguarde alguns minutos e tente novamente');
        console.log(`4. Execute: npx tsx scripts/verify-domain.ts ${domainId}`);
    }
}

verifyDomain().catch((error) => {
    console.error('❌ Erro:', error);
    process.exit(1);
});
