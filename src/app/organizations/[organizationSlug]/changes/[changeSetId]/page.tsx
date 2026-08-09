import { notFound } from "next/navigation";

import { BusinessWorkspace } from "@/components/pages/business-workspace/business-workspace";
import {
  hasWorkspacePermission,
  requireOrganizationContext,
} from "@/lib/server/auth/session";
import { getChangeWorkspaceData } from "@/lib/server/workspace-service";

type ChangePageProps = {
  params: Promise<{
    organizationSlug: string;
    changeSetId: string;
  }>;
};

export default async function ChangePage({ params }: ChangePageProps) {
  const { organizationSlug, changeSetId } = await params;

  const context = await requireOrganizationContext(organizationSlug);
  const workspace = await getChangeWorkspaceData(
    context.organizationId,
    changeSetId,
  );

  if (!workspace) {
    notFound();
  }

  return (
    <BusinessWorkspace
      key={workspace.changeResult?.id}
      organizationSlug={organizationSlug}
      canChange={hasWorkspacePermission(context.role, "change")}
      workspace={workspace}
    />
  );
}
