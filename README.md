# BizFlow Pro

> Sistema ERP e CRM unificado para a indústria de mármore e granito

BizFlow Pro combina funcionalidades avançadas de CRM (inspiradas no GoHighLevel) com recursos específicos de ERP para pedras naturais (inspirados no Stone Profits System).

## 🚀 Features

### ✅ Implementado

#### CRM & Automação (GoHighLevel-inspired)
- **Pipelines & Opportunities** - Kanban visual para rastreamento de vendas
- **Unified Conversations** - Inbox centralizado para Email/SMS
- **Calendars & Appointments** - Sistema de agendamento
- **Automation Workflows** - Automações "If This Then That" com builder visual
- **Public Forms** - Formulários de captura de leads integrados ao pipeline
- **Custom Fields** - Campos personalizados (Texto, Data, Arquivo, Tags, etc.)

#### ERP para Pedras Naturais (Stone Profits-inspired)
- **Advanced Inventory** - Gestão hierárquica (Blocks → Bundles → Slabs)
- **Quoting & Estimates** - Geração de orçamentos com PDF
- **Job Management** - Rastreamento de fabricação (Template → Cut → Polish → Install)
- **Sales & Orders** - Gestão completa de pedidos

#### Módulos Core
- **Finance** - Gestão de transações financeiras
- **Contacts** - CRM completo com stages
- **Dashboard** - Estatísticas em tempo real

### 🚧 Em Desenvolvimento
- List View & Advanced Filters
- AI Features (Lead Scoring)
- Purchasing & Container Management

## 🛠️ Tech Stack

- **Framework**: Next.js 16.0.3 (Turbopack)
- **Database**: Prisma 6.19.0 + SQLite
- **Styling**: Tailwind CSS
- **UI**: Custom components + Lucide icons
- **PDF**: jsPDF + jspdf-autotable

## 📦 Installation

```bash
# Clone o repositório
git clone <repository-url>
cd bizflow-pro

# Instale as dependências
npm install

# Configure o banco de dados
npx prisma db push

# Popule com dados demo
npx tsx prisma/seed.ts

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse: `http://localhost:3000`

## 🗄️ Database Setup

### Sync Schema
```bash
npx prisma db push
```

### Seed Demo Data
```bash
npx tsx prisma/seed.ts
```

Isso cria:
- Tenant demo: `demo-tenant-1`
- Contatos de exemplo: João Silva e Maria Santos

### Prisma Studio (Visual DB Editor)
```bash
npx prisma studio
```

## 📝 Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm start            # Servidor de produção
npm run lint         # Linter
```

## 🏗️ Estrutura do Projeto

```
bizflow-pro/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed script
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── automation/    # Workflow automation
│   │   ├── crm/          # CRM modules
│   │   ├── finance/      # Finance module
│   │   ├── inventory/    # Inventory management
│   │   ├── jobs/         # Job management
│   │   └── orders/       # Sales & orders
│   ├── components/       # Reusable components
│   │   ├── Modal.tsx
│   │   └── Sidebar.tsx
│   └── lib/              # Server actions & utilities
│       ├── workflow-engine.ts
│       ├── workflow-actions.ts
│       ├── workflow-triggers.ts
│       ├── decimal-utils.ts
│       └── prisma.ts
├── TASK.md              # Task tracking
└── README.md            # This file
```

## 🎯 Automation Workflows

### Como Usar

1. **Acesse** `/automation`
2. **Crie** um novo workflow
3. **Configure** o gatilho (Contact Created, Tag Added, etc.)
4. **Adicione** ações (Send Email, Send SMS, Create Task, etc.)
5. **Salve** e ative o workflow

### Triggers Disponíveis
- Contact Created
- Tag Added
- Pipeline Stage Changed
- Form Submitted

### Actions Disponíveis
- Send Email (simulado - logs)
- Send SMS (simulado - logs)
- Create Task
- Add Tag
- Update Field

> **Nota**: Email/SMS são simulados (console logs). Para produção, configure SendGrid/Resend (email) e Twilio (SMS).

## 🔐 Multi-Tenancy

O sistema suporta multi-tenancy. Tenant padrão: `demo-tenant-1`

Para adicionar novos tenants, use Prisma Studio ou crie via seed script.

## 🐛 Bug Fixes Aplicados

- ✅ Prisma 7 → Prisma 6 (compatibilidade Next.js 16)
- ✅ Decimal serialization (helper function)
- ✅ Foreign key constraints (seed script)
- ✅ TypeScript strict mode
- ✅ Build de produção passando

## 📚 Documentação

- **TASK.md** - Lista completa de tarefas e features
- **Walkthrough** - Guia de implementação detalhado
- **Schema** - Veja `prisma/schema.prisma` para modelos de dados

## 🤝 Contributing

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 License

Este projeto é privado e proprietário.

## 🙏 Acknowledgments

- Inspirado no **GoHighLevel** para funcionalidades de CRM e automação
- Inspirado no **Stone Profits System** para funcionalidades específicas da indústria de pedras naturais

---

**Status**: ✅ Phase 16 Complete - Public Forms, Automations & CRM Enhancements

**Build**: ✅ Passing

**Version**: 0.1.0
