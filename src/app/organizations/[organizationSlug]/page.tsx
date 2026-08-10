import { WorkflowHome } from "@/components/pages/workflow-workspace/workflow-home";
import {
  hasWorkspacePermission,
  requireOrganizationContext,
} from "@/lib/server/auth/session";
import { getWorkflowHomeData } from "@/lib/server/workflow-service";

type OrganizationPageProps = {
  params: Promise<{ organizationSlug: string }>;
};

export default async function OrganizationPage({
  params,
}: OrganizationPageProps) {
  const { organizationSlug } = await params;

  const context = await requireOrganizationContext(organizationSlug);
  const data = await getWorkflowHomeData(
    context.organizationId,
    context.user.id,
  );

  return (
    <WorkflowHome
      organizationSlug={organizationSlug}
      userName={context.user.name}
      canMutate={hasWorkspacePermission(context.role, "change")}
      data={data}
    />
  );
}
