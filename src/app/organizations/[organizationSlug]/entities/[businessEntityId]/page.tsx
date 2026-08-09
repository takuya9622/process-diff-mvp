import { notFound } from "next/navigation";

import { BusinessWorkspace } from "@/components/pages/business-workspace/business-workspace";
import {
  hasWorkspacePermission,
  requireOrganizationContext,
} from "@/lib/server/auth/session";
import { getEntityWorkspaceData } from "@/lib/server/workspace-service";

type EntityPageProps = {
  params: Promise<{
    organizationSlug: string;
    businessEntityId: string;
  }>;
};

export default async function EntityPage({ params }: EntityPageProps) {
  const { organizationSlug, businessEntityId } = await params;

  const context = await requireOrganizationContext(organizationSlug);
  const workspace = await getEntityWorkspaceData(
    context.organizationId,
    businessEntityId,
  );

  if (!workspace) {
    notFound();
  }

  return (
    <BusinessWorkspace
      key={workspace.selectedEntity.id}
      organizationSlug={organizationSlug}
      canChange={hasWorkspacePermission(context.role, "change")}
      workspace={workspace}
    />
  );
}
