import { notFound } from "next/navigation";

import { BusinessWorkspace } from "@/components/pages/business-workspace/business-workspace";
import { isCurrentDemoOrganization } from "@/constants/routes";
import { getEntityWorkspaceData } from "@/lib/server/workspace-service";

type EntityPageProps = {
  params: Promise<{
    organizationSlug: string;
    businessEntityId: string;
  }>;
};

export default async function EntityPage({ params }: EntityPageProps) {
  const { organizationSlug, businessEntityId } = await params;

  if (!isCurrentDemoOrganization(organizationSlug)) {
    notFound();
  }

  const workspace = await getEntityWorkspaceData(businessEntityId);

  if (!workspace) {
    notFound();
  }

  return (
    <BusinessWorkspace
      key={workspace.selectedEntity.id}
      organizationSlug={organizationSlug}
      workspace={workspace}
    />
  );
}
