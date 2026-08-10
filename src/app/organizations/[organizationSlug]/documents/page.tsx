import { DocumentLibrary } from "@/components/pages/business-workspace/document-library";
import { requireOrganizationContext } from "@/lib/server/auth/session";
import { getWorkspaceNavigationEntities } from "@/lib/server/workspace-service";

type DocumentLibraryPageProps = {
  params: Promise<{ organizationSlug: string }>;
};

export default async function DocumentLibraryPage({
  params,
}: DocumentLibraryPageProps) {
  const { organizationSlug } = await params;
  const context = await requireOrganizationContext(organizationSlug);
  const entities = await getWorkspaceNavigationEntities(context.organizationId);

  return (
    <DocumentLibrary organizationSlug={organizationSlug} entities={entities} />
  );
}
