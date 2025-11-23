import { getUsers } from '@/lib/settings-actions';
import { getEmailDomains } from '@/lib/email-domain-actions';
import { getTags } from '@/lib/tag-actions';
import SettingsPageClient from '@/components/settings/SettingsPage';

const TENANT_ID = 'demo-tenant-1'; // In a real app, get from session

export default async function SettingsPage() {
    const [users, emailDomains, tags] = await Promise.all([
        getUsers(TENANT_ID),
        getEmailDomains(TENANT_ID),
        getTags(TENANT_ID)
    ]);

    return <SettingsPageClient users={users} emailDomains={emailDomains} tags={tags} tenantId={TENANT_ID} />;
}
