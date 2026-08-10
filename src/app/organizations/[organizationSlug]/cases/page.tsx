import { CaseList } from "@/components/pages/workflow-workspace/case-list";
import { requireOrganizationContext } from "@/lib/server/auth/session";
import { getCaseList } from "@/lib/server/workflow-service";

type CaseListPageProps = {
  params: Promise<{ organizationSlug: string }>;
};

export default async function CaseListPage({ params }: CaseListPageProps) {
  const { organizationSlug } = await params;
  const context = await requireOrganizationContext(organizationSlug);
  const cases = await getCaseList(context.organizationId, context.user.id);

  return <CaseList organizationSlug={organizationSlug} cases={cases} />;
}
