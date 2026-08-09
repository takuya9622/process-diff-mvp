import { notFound } from "next/navigation";

import { BusinessWorkspace } from "@/components/pages/business-workspace/business-workspace";
import { isCurrentDemoOrganization } from "@/constants/routes";
import { getChangeWorkspaceData } from "@/lib/server/workspace-service";

type ChangePageProps = {
  params: Promise<{
    organizationSlug: string;
    changeSetId: string;
  }>;
};

export default async function ChangePage({ params }: ChangePageProps) {
  const { organizationSlug, changeSetId } = await params;

  if (!isCurrentDemoOrganization(organizationSlug)) {
    notFound();
  }

  const workspace = await getChangeWorkspaceData(changeSetId);

  if (!workspace) {
    notFound();
  }

  return (
    <BusinessWorkspace
      key={workspace.changeResult?.id}
      organizationSlug={organizationSlug}
      workspace={workspace}
    />
  );
}
