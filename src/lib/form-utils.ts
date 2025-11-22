// Form utility functions and constants (client-safe)

export function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dashes
        .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
        .substring(0, 50); // Limit length
}

export const FIELD_TYPES = [
    { value: 'TEXT', label: 'Texto' },
    { value: 'EMAIL', label: 'Email' },
    { value: 'PHONE', label: 'Telefone' },
    { value: 'TEXTAREA', label: 'Texto Longo' },
    { value: 'SELECT', label: 'Seleção' },
    { value: 'CHECKBOX', label: 'Checkbox' },
    { value: 'RADIO', label: 'Múltipla Escolha' },
    { value: 'DATE', label: 'Data' },
    { value: 'NUMBER', label: 'Número' },
] as const;

export const CONTACT_MAPPINGS = [
    { value: '', label: 'Não mapear' },
    { value: 'name', label: 'Nome do Contato' },
    { value: 'email', label: 'Email do Contato' },
    { value: 'phone', label: 'Telefone do Contato' },
] as const;

export const PAGE_BLOCK_TYPES = [
    {
        type: 'hero',
        label: 'Hero Section',
        icon: '🎯',
        defaultContent: {
            title: 'Título Principal',
            subtitle: 'Subtítulo descritivo',
            buttonText: 'Ação Principal',
            buttonUrl: '#',
            backgroundImage: '',
        },
    },
    {
        type: 'text',
        label: 'Texto',
        icon: '📝',
        defaultContent: {
            content: 'Seu texto aqui...',
            alignment: 'left',
        },
    },
    {
        type: 'image',
        label: 'Imagem',
        icon: '🖼️',
        defaultContent: {
            src: '/placeholder.jpg',
            alt: 'Descrição da imagem',
            width: '100%',
        },
    },
    {
        type: 'video',
        label: 'Vídeo',
        icon: '🎬',
        defaultContent: {
            url: '',
            autoplay: false,
        },
    },
    {
        type: 'form',
        label: 'Formulário',
        icon: '📋',
        defaultContent: {
            formId: '',
        },
    },
    {
        type: 'features',
        label: 'Features',
        icon: '✨',
        defaultContent: {
            title: 'Nossos Diferenciais',
            items: [
                { icon: '⚡', title: 'Rápido', description: 'Resultados imediatos' },
                { icon: '🔒', title: 'Seguro', description: 'Seus dados protegidos' },
                { icon: '💰', title: 'Acessível', description: 'Preços competitivos' },
            ],
        },
    },
    {
        type: 'testimonials',
        label: 'Depoimentos',
        icon: '💬',
        defaultContent: {
            title: 'O que nossos clientes dizem',
            items: [
                { name: 'João Silva', text: 'Excelente serviço!', avatar: '' },
            ],
        },
    },
    {
        type: 'cta',
        label: 'Call to Action',
        icon: '🚀',
        defaultContent: {
            title: 'Pronto para começar?',
            subtitle: 'Entre em contato agora mesmo',
            buttonText: 'Começar Agora',
            buttonUrl: '#',
        },
    },
    {
        type: 'divider',
        label: 'Divisor',
        icon: '➖',
        defaultContent: {
            style: 'line',
            height: 40,
        },
    },
    {
        type: 'countdown',
        label: 'Contador Regressivo',
        icon: '⏰',
        defaultContent: {
            targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            title: 'Oferta termina em:',
        },
    },
] as const;
