import { WorkflowCatalog } from "@/components/pages/workflow-workspace/workflow-catalog";
import { requireOrganizationContext } from "@/lib/server/auth/session";
import { getWorkflowCatalog } from "@/lib/server/workflow-service";

type WorkflowCatalogPageProps = {
  params: Promise<{ organizationSlug: string }>;
};

export default async function WorkflowCatalogPage({
  params,
}: WorkflowCatalogPageProps) {
  const { organizationSlug } = await params;
  const context = await requireOrganizationContext(organizationSlug);
  const workflows = await getWorkflowCatalog(context.organizationId);

  return (
    <WorkflowCatalog
      organizationSlug={organizationSlug}
      workflows={workflows}
    />
  );
}
