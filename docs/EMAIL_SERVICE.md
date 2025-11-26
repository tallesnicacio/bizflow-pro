# 📧 Serviço de Email - BizFlow Pro

Documentação completa do serviço de email usando Resend API.

## 📋 Índice

- [Configuração](#configuração)
- [Uso Básico](#uso-básico)
- [Templates Disponíveis](#templates-disponíveis)
- [Funções Auxiliares](#funções-auxiliares)
- [Exemplos de Uso](#exemplos-de-uso)
- [Testes](#testes)
- [Gerenciamento de Domínios](#gerenciamento-de-domínios)

## 🔧 Configuração

### 1. Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=onboarding@resend.dev
```

### 2. Obter API Key

1. Acesse [https://resend.com/api-keys](https://resend.com/api-keys)
2. Crie uma nova API key
3. Copie e cole no arquivo `.env`

### 3. Verificar Configuração

Execute o script de verificação:

```bash
npx tsx scripts/verify-resend-key.ts seu@email.com
```

## 🚀 Uso Básico

### Envio Simples

```typescript
import { emailService } from '@/lib/services/email-service';

await emailService.sendEmail(
  'destinatario@example.com',
  'Assunto do Email',
  '<h1>Conteúdo HTML</h1>',
  'remetente@seudominio.com' // Opcional
);
```

### Usando Helpers (Recomendado)

```typescript
import { sendWelcomeEmail } from '@/lib/services/email-helpers';

await sendWelcomeEmail('usuario@example.com', {
  userName: 'João Silva',
  companyName: 'Minha Empresa',
  loginUrl: 'https://app.example.com/login'
});
```

## 🎨 Templates Disponíveis

### 1. Email de Boas-Vindas

Design profissional com gradiente roxo e informações de boas-vindas.

```typescript
import { sendWelcomeEmail } from '@/lib/services/email-helpers';

await sendWelcomeEmail('usuario@example.com', {
  userName: 'Nome do Usuário',
  companyName: 'Nome da Empresa', // Opcional
  loginUrl: 'https://app.com/login'
});
```

### 2. Notificação de Novo Lead

Notifica a equipe sobre novos leads capturados via formulários.

```typescript
import { sendNewLeadNotification } from '@/lib/services/email-helpers';

await sendNewLeadNotification('equipe@example.com', {
  leadName: 'João Silva',
  leadEmail: 'joao@example.com',
  formName: 'Formulário de Contato',
  submissionData: {
    'Nome': 'João Silva',
    'Email': 'joao@example.com',
    'Telefone': '(11) 98765-4321',
    'Mensagem': 'Gostaria de mais informações'
  },
  viewUrl: 'https://app.com/crm/leads/123'
});
```

### 3. Mudança de Estágio de Oportunidade

Notifica sobre mudanças no pipeline de vendas.

```typescript
import { sendOpportunityStageChangeNotification } from '@/lib/services/email-helpers';

await sendOpportunityStageChangeNotification('vendedor@example.com', {
  opportunityTitle: 'Venda - Empresa X',
  oldStage: 'Proposta Enviada',
  newStage: 'Negociação',
  contactName: 'João Silva',
  value: 25000.00,
  viewUrl: 'https://app.com/crm/opportunities/456'
});
```

### 4. Confirmação de Formulário

Email de confirmação automático para quem preenche formulários.

```typescript
import { sendFormSubmissionConfirmation } from '@/lib/services/email-helpers';

await sendFormSubmissionConfirmation('usuario@example.com', {
  contactName: 'João Silva',
  formName: 'Contato para Demonstração',
  message: 'Nossa equipe entrará em contato em breve!' // Opcional
});
```

## 🛠️ Funções Auxiliares

### resend-service.ts

Funções de baixo nível para interação direta com a API do Resend:

```typescript
import { resendService } from '@/lib/services/resend-service';

// Enviar email individual
await resendService.sendEmail({
  from: 'noreply@example.com',
  to: 'destinatario@example.com',
  subject: 'Assunto',
  html: '<p>Conteúdo</p>',
  text: 'Conteúdo em texto' // Opcional
});

// Enviar emails em massa
await resendService.sendBulkEmail([
  { from: '...', to: '...', subject: '...', html: '...' },
  { from: '...', to: '...', subject: '...', html: '...' }
]);

// Adicionar domínio customizado
await resendService.addDomain('seudominio.com');

// Verificar domínio
await resendService.verifyDomain('domain_id');
```

### email-templates.ts

Templates HTML prontos para uso:

```typescript
import { emailTemplates } from '@/lib/services/email-templates';

const htmlContent = emailTemplates.welcome({
  userName: 'João',
  companyName: 'Empresa',
  loginUrl: 'https://...'
});
```

## 📝 Exemplos de Uso

### Exemplo 1: Novo Usuário

```typescript
'use server';

import { sendWelcomeEmail } from '@/lib/services/email-helpers';

export async function createUser(email: string, name: string) {
  // ... criar usuário no banco ...

  // Enviar email de boas-vindas
  await sendWelcomeEmail(email, {
    userName: name,
    companyName: 'BizFlow Pro',
    loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`
  });

  return { success: true };
}
```

### Exemplo 2: Submissão de Formulário

```typescript
'use server';

import {
  sendFormSubmissionConfirmation,
  sendNewLeadNotification
} from '@/lib/services/email-helpers';

export async function handleFormSubmission(formData: any) {
  // ... salvar no banco ...

  // Enviar confirmação para o cliente
  await sendFormSubmissionConfirmation(formData.email, {
    contactName: formData.name,
    formName: 'Formulário de Contato',
    message: 'Recebemos sua mensagem e responderemos em breve!'
  });

  // Notificar equipe interna
  await sendNewLeadNotification('vendas@empresa.com', {
    leadName: formData.name,
    leadEmail: formData.email,
    formName: 'Formulário de Contato',
    submissionData: formData,
    viewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/crm/leads/${leadId}`
  });

  return { success: true };
}
```

### Exemplo 3: Mudança de Pipeline

```typescript
'use server';

import { sendOpportunityStageChangeNotification } from '@/lib/services/email-helpers';

export async function updateOpportunityStage(
  opportunityId: string,
  newStageId: string
) {
  const opportunity = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    include: { contact: true, stage: true }
  });

  // Atualizar estágio...
  const oldStage = opportunity.stage.name;
  await prisma.opportunity.update({
    where: { id: opportunityId },
    data: { stageId: newStageId }
  });

  const newStage = await prisma.pipelineStage.findUnique({
    where: { id: newStageId }
  });

  // Notificar responsável
  await sendOpportunityStageChangeNotification('vendedor@empresa.com', {
    opportunityTitle: opportunity.title,
    oldStage: oldStage,
    newStage: newStage.name,
    contactName: opportunity.contact.name,
    value: opportunity.value.toNumber(),
    viewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/crm/opportunities/${opportunityId}`
  });
}
```

## 🧪 Testes

### Testar Conexão e API Key

```bash
npx tsx scripts/verify-resend-key.ts seu@email.com
```

### Testar Email Simples

```bash
npx tsx scripts/simple-email-test.ts seu@email.com
```

### Testar Todos os Templates

```bash
npx tsx scripts/test-templates.ts seu@email.com
```

### Testar Template Específico

```bash
npx tsx scripts/test-one-template.ts seu@email.com
```

## 🌐 Gerenciamento de Domínios

### Adicionar Domínio Customizado

Para usar um email personalizado (ex: `contato@suaempresa.com`):

1. **Adicionar domínio via código:**

```typescript
import { resendService } from '@/lib/services/resend-service';

const result = await resendService.addDomain('suaempresa.com');

if (result.success) {
  console.log('Domínio adicionado!');
  console.log('Registros DNS:', result.dnsRecords);
}
```

2. **Configurar DNS:**

Adicione os registros DNS fornecidos no painel do seu provedor de domínio:
- DKIM
- SPF
- DMARC

3. **Verificar domínio:**

```typescript
await resendService.verifyDomain(result.domainId);
```

4. **Atualizar .env:**

```env
RESEND_FROM_EMAIL=contato@suaempresa.com
```

## 🔒 Segurança

### Modo de Simulação

Quando `RESEND_API_KEY` não está configurada, o serviço entra em **modo de simulação**:

- Emails não são enviados
- Logs são exibidos no console
- Útil para desenvolvimento e testes

### Proteção de API Key

⚠️ **NUNCA** commite o arquivo `.env` com a API key:

```bash
# Adicione ao .gitignore
.env
.env.local
.env.*.local
```

## 📊 Retorno das Funções

Todas as funções retornam um objeto com:

```typescript
{
  success: boolean;
  data?: {
    id: string; // ID do email no Resend
  };
  error?: string; // Mensagem de erro se houver
  simulated?: boolean; // true se em modo simulação
}
```

## 🆘 Troubleshooting

### Erro: "API key is invalid"

1. Verifique se a API key está correta no `.env`
2. Confirme que não há espaços extras
3. Teste com `scripts/verify-resend-key.ts`

### Erro: "Rate limit exceeded"

O plano gratuito do Resend tem limites:
- 2 requisições por segundo
- 100 emails por dia

Solução: Aguarde alguns segundos entre os envios.

### Email não chega

1. Verifique a pasta de spam
2. Confirme que o email do remetente está correto
3. Se usando domínio customizado, verifique configuração DNS

## 📚 Recursos Adicionais

- [Documentação Resend](https://resend.com/docs)
- [Resend SDK](https://github.com/resend/resend-node)
- [Templates Resend](https://resend.com/templates)

## 🤝 Contribuindo

Para adicionar novos templates:

1. Adicione o template em `src/lib/services/email-templates.ts`
2. Crie a função helper em `src/lib/services/email-helpers.ts`
3. Adicione testes em `scripts/test-templates.ts`
4. Atualize esta documentação

---

**Desenvolvido com ❤️ para BizFlow Pro**
