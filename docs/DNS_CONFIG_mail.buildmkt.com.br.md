# 🌐 Configuração DNS - mail.buildmkt.com.br

Guia completo para configurar o domínio `mail.buildmkt.com.br` para envio de emails via Resend.

## 📋 Informações do Domínio

- **Domínio:** mail.buildmkt.com.br
- **ID no Resend:** ad911651-3966-4fd1-983f-082495c5e9f9
- **Status:** Aguardando configuração DNS
- **Uso:** Envio de emails transacionais do BizFlow Pro

## 🔧 Registros DNS Necessários

Adicione os seguintes registros no painel de DNS do seu provedor (Registro.br, Cloudflare, etc.):

### 1. Registro DKIM (Autenticação)

```
Tipo: TXT
Nome: resend._domainkey.mail
Valor: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDg6/56cUwqwWgVed6xNwZzzWwtyNYRHgoZCo8OiJXs5qNw5yvFTpxD7YaM4WV9ZBdJp3lh3+TCI7OLAZss+DbJCIMHGLKdiqsP87vrdSLHftwwB4VXIfUfAAbzrxjfMLhMuLypRF1A7FTQgn/SUW3pTW4l1Mpp1THVrxPA3jjMywIDAQAB
TTL: Auto (ou 3600)
```

### 2. Registro MX (Recebimento de Feedback)

```
Tipo: MX
Nome: send.mail
Valor: feedback-smtp.us-east-1.amazonses.com
Prioridade: 10
TTL: Auto (ou 3600)
```

### 3. Registro SPF (Prevenção de Spam)

```
Tipo: TXT
Nome: send.mail
Valor: v=spf1 include:amazonses.com ~all
TTL: Auto (ou 3600)
```

## 📝 Instruções por Provedor

### Registro.br (Brasil)

1. Acesse o painel do Registro.br
2. Vá em "Gerenciar DNS"
3. Selecione o domínio `buildmkt.com.br`
4. Clique em "Adicionar Registro"
5. Adicione cada registro conforme especificado acima

**Observação:** No Registro.br, use `mail.buildmkt.com.br` como nome completo se necessário.

### Cloudflare

1. Acesse o Dashboard do Cloudflare
2. Selecione o domínio `buildmkt.com.br`
3. Vá em "DNS" > "Records"
4. Clique em "Add record"
5. Para cada registro:
   - **DKIM:**
     - Type: TXT
     - Name: `resend._domainkey.mail`
     - Content: (valor do DKIM acima)
     - Proxy status: DNS only (desative o proxy laranja)

   - **MX:**
     - Type: MX
     - Name: `send.mail`
     - Mail server: `feedback-smtp.us-east-1.amazonses.com`
     - Priority: 10
     - Proxy status: DNS only

   - **SPF:**
     - Type: TXT
     - Name: `send.mail`
     - Content: `v=spf1 include:amazonses.com ~all`
     - Proxy status: DNS only

### GoDaddy

1. Acesse "Meus Produtos"
2. Clique em "DNS" ao lado do domínio
3. Role até "Registros"
4. Clique em "ADICIONAR"
5. Adicione cada registro conforme as especificações

## ✅ Verificação

### 1. Aguarde a Propagação DNS

A propagação pode levar de 15 minutos a 48 horas, mas geralmente ocorre em 15-30 minutos.

### 2. Verifique os Registros (Opcional)

Use ferramentas online para verificar se os registros foram propagados:

- https://mxtoolbox.com/
- https://dnschecker.org/

### 3. Verifique no Resend

Execute o script de verificação:

```bash
npx tsx scripts/verify-domain.ts ad911651-3966-4fd1-983f-082495c5e9f9
```

Saída esperada quando verificado:
```
✅ Domínio verificado com sucesso!
```

## 🔄 Atualização do .env

Após a verificação bem-sucedida, atualize o arquivo `.env`:

```env
RESEND_FROM_EMAIL=noreply@mail.buildmkt.com.br
```

Você pode usar qualquer email antes do @:
- `contato@mail.buildmkt.com.br`
- `suporte@mail.buildmkt.com.br`
- `vendas@mail.buildmkt.com.br`
- etc.

## 🧪 Teste de Envio

Depois de configurado e verificado, teste o envio:

```bash
npx tsx scripts/simple-email-test.ts seu@email.com
```

Você deve receber um email de teste vindo de `onboarding@mail.buildmkt.com.br` ou do email configurado no `.env`.

## ❓ Troubleshooting

### Domínio não verifica

**Problema:** O script retorna "Domínio ainda não verificado"

**Soluções:**
1. Verifique se todos os 3 registros foram adicionados corretamente
2. Aguarde mais tempo (até 1 hora)
3. Verifique se não há espaços extras nos valores
4. Confirme que o TTL não está muito alto (use 3600 ou Auto)
5. Em caso de dúvida, remova e adicione os registros novamente

### Erro ao enviar email

**Problema:** Email não é enviado mesmo com domínio verificado

**Soluções:**
1. Confirme que atualizou o `.env` com o novo email
2. Verifique se reiniciou a aplicação após alterar o `.env`
3. Teste com o script de envio simples primeiro
4. Verifique se não há rate limit

### Email vai para spam

**Problema:** Emails chegam mas vão direto para spam

**Soluções:**
1. Adicione registro DMARC:
   ```
   Tipo: TXT
   Nome: _dmarc.mail
   Valor: v=DMARC1; p=none; rua=mailto:dmarc@buildmkt.com.br
   ```
2. Configure warmup do domínio (envie poucos emails inicialmente)
3. Use conteúdo HTML bem formatado
4. Evite palavras típicas de spam

## 📞 Suporte

Se tiver problemas:

1. Verifique a documentação do Resend: https://resend.com/docs/dashboard/domains/introduction
2. Entre em contato com o suporte do seu provedor de DNS
3. Verifique os logs do console ao executar os scripts

## 📊 Status Atual

- [x] Domínio adicionado ao Resend
- [ ] Registros DNS configurados
- [ ] Domínio verificado
- [ ] Email de teste enviado com sucesso

---

**Última atualização:** $(date)
**Configurado por:** Claude Code
