import { getPipelines } from '@/lib/pipeline-actions';
import PipelineSettings from '@/components/crm/PipelineSettings';

const TENANT_ID = 'demo-tenant-1';

export default async function PipelineSettingsPage() {
    const pipelines = await getPipelines(TENANT_ID);

    // For MVP, just edit the first pipeline found
    const pipeline = pipelines[0];

    if (!pipeline) {
        return <div className="p-8">No pipeline found. Create one first.</div>;
    }

    return <PipelineSettings pipeline={pipeline} />;
}
