import { notFound } from "next/navigation";

import { CaseDetail } from "@/components/pages/workflow-workspace/case-detail";
import {
  hasWorkspacePermission,
  requireOrganizationContext,
} from "@/lib/server/auth/session";
import { getCaseDetail } from "@/lib/server/workflow-service";

type CaseDetailPageProps = {
  params: Promise<{ organizationSlug: string; caseId: string }>;
};

export default async function CaseDetailPage({
  params,
}: CaseDetailPageProps) {
  const { organizationSlug, caseId } = await params;
  const context = await requireOrganizationContext(organizationSlug);
  const caseDetail = await getCaseDetail(context.organizationId, caseId);

  if (!caseDetail) {
    notFound();
  }

  return (
    <CaseDetail
      organizationSlug={organizationSlug}
      currentUserId={context.user.id}
      canMutate={hasWorkspacePermission(context.role, "change")}
      caseDetail={caseDetail}
    />
  );
}
