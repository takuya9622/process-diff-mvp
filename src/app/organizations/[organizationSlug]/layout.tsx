import { notFound } from "next/navigation";

import { WorkspaceShell } from "@/components/pages/business-workspace/workspace-shell";
import { isCurrentDemoOrganization } from "@/constants/routes";
import { getWorkspaceNavigationEntities } from "@/lib/server/workspace-service";

export const dynamic = "force-dynamic";

type OrganizationLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ organizationSlug: string }>;
};

export default async function OrganizationLayout({
  children,
  params,
}: OrganizationLayoutProps) {
  const { organizationSlug } = await params;

  if (!isCurrentDemoOrganization(organizationSlug)) {
    notFound();
  }

  const entities = await getWorkspaceNavigationEntities();

  return (
    <WorkspaceShell organizationSlug={organizationSlug} entities={entities}>
      {children}
    </WorkspaceShell>
  );
}
