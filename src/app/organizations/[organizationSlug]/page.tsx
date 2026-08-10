import { redirect } from "next/navigation";

import { createEntityPath } from "@/constants/routes";
import { requireOrganizationContext } from "@/lib/server/auth/session";
import { getInitialWorkspaceEntityId } from "@/lib/server/workspace-service";

type OrganizationPageProps = {
  params: Promise<{ organizationSlug: string }>;
};

export default async function OrganizationPage({
  params,
}: OrganizationPageProps) {
  const { organizationSlug } = await params;

  const context = await requireOrganizationContext(organizationSlug);
  const initialEntityId = await getInitialWorkspaceEntityId(
    context.organizationId,
  );
  redirect(createEntityPath(organizationSlug, initialEntityId));
}
