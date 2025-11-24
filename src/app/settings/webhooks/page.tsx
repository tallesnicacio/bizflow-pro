import { auth } from '@/auth';
import { WebhookManager } from './WebhookManager';
import { redirect } from 'next/navigation';

export default async function WebhooksPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    return <WebhookManager tenantId={session.user.tenantId} />;
}
