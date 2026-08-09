import { WorkspaceShell } from "@/components/pages/business-workspace/workspace-shell";
import { ORGANIZATION_ROLE_LABELS } from "@/lib/auth/access-control";
import {
  hasWorkspacePermission,
  requireOrganizationContext,
} from "@/lib/server/auth/session";
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

  const context = await requireOrganizationContext(organizationSlug);
  const entities = await getWorkspaceNavigationEntities(context.organizationId);

  return (
    <WorkspaceShell
      organizationSlug={organizationSlug}
      organizationName={context.organizationName}
      userName={context.user.name}
      roleLabel={ORGANIZATION_ROLE_LABELS[context.role]}
      canReset={hasWorkspacePermission(context.role, "reset")}
      entities={entities}
    >
      {children}
    </WorkspaceShell>
  );
}
