import { getUserTasks } from '@/lib/task-actions';
import { TasksList } from '@/components/crm/TasksList';

// Mock user ID for now - in real app would come from auth session
const MOCK_USER_ID = 'user_cm3t7v8yq0001v8yq8yq8yq8y';
const TENANT_ID = 'demo-tenant-1';

export default async function TasksPage() {
    const tasks = await getUserTasks(MOCK_USER_ID, TENANT_ID);

    return <TasksList tasks={tasks} userId={MOCK_USER_ID} tenantId={TENANT_ID} />;
}
