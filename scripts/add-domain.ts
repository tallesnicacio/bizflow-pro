import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { resendService } from '../src/lib/services/resend-service';

const domain = process.argv[2];

if (!domain) {
    console.error('❌ Por favor, forneça um domínio');
    console.log('Uso: npx tsx scripts/add-domain.ts mail.buildmkt.com.br');
    process.exit(1);
}

async function addDomain() {
    console.log(`🌐 Adicionando domínio: ${domain}\n`);

    const result = await resendService.addDomain(domain);

    if (!result.success) {
        console.error('❌ Erro ao adicionar domínio:', result.error);
        process.exit(1);
    }

    if (result.simulated) {
        console.log('⚠️  Modo de simulação - API key não configurada');
        console.log(result.dnsRecords);
        return;
    }

    console.log('✅ Domínio adicionado com sucesso!\n');
    console.log(`📋 ID do domínio: ${result.domainId}\n`);

    console.log('📝 Configuração DNS Necessária:\n');
    console.log('Adicione os seguintes registros DNS no painel do seu provedor de domínio:\n');

    if (result.dnsRecords) {
        const records = result.dnsRecords as any;

        if (Array.isArray(records)) {
            records.forEach((record: any, index: number) => {
                console.log(`${index + 1}. Tipo: ${record.type || record.record_type || 'N/A'}`);
                console.log(`   Nome: ${record.name || record.record || 'N/A'}`);
                console.log(`   Valor: ${record.value || 'N/A'}`);
                console.log(`   TTL: ${record.ttl || '3600'}`);
                console.log('');
            });
        } else {
            console.log(JSON.stringify(records, null, 2));
        }
    }

    console.log('\n📌 Próximos passos:');
    console.log('1. Adicione os registros DNS acima no painel do seu provedor');
    console.log('2. Aguarde a propagação DNS (pode levar até 48h, geralmente 15-30 min)');
    console.log('3. Verifique o domínio com: npx tsx scripts/verify-domain.ts ' + result.domainId);
    console.log('4. Atualize o .env com: RESEND_FROM_EMAIL=noreply@' + domain);
}

addDomain().catch((error) => {
    console.error('❌ Erro:', error);
    process.exit(1);
});
