import { notFound } from "next/navigation";

import { WorkItemWorkspace } from "@/components/pages/workflow-workspace/work-item-workspace";
import {
  hasWorkspacePermission,
  requireOrganizationContext,
} from "@/lib/server/auth/session";
import { getWorkItemDetail } from "@/lib/server/workflow-service";

type WorkItemPageProps = {
  params: Promise<{
    organizationSlug: string;
    caseId: string;
    workItemId: string;
  }>;
};

export default async function WorkItemPage({ params }: WorkItemPageProps) {
  const { organizationSlug, caseId, workItemId } = await params;
  const context = await requireOrganizationContext(organizationSlug);
  const workItem = await getWorkItemDetail(
    context.organizationId,
    caseId,
    workItemId,
  );

  if (!workItem) {
    notFound();
  }

  return (
    <WorkItemWorkspace
      organizationSlug={organizationSlug}
      currentUserId={context.user.id}
      canMutate={hasWorkspacePermission(context.role, "change")}
      workItem={workItem}
    />
  );
}
