import { notFound, redirect } from "next/navigation";

import {
  createEntityPath,
  isCurrentDemoOrganization,
} from "@/constants/routes";
import { getInitialWorkspaceEntityId } from "@/lib/server/workspace-service";

type OrganizationPageProps = {
  params: Promise<{ organizationSlug: string }>;
};

export default async function OrganizationPage({
  params,
}: OrganizationPageProps) {
  const { organizationSlug } = await params;

  if (!isCurrentDemoOrganization(organizationSlug)) {
    notFound();
  }

  const initialEntityId = await getInitialWorkspaceEntityId();
  redirect(createEntityPath(organizationSlug, initialEntityId));
}
