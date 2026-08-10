import { CommunicationWorkspace } from "@/components/pages/communication-workspace/communication-workspace";
import {
  hasWorkspacePermission,
  requireOrganizationContext,
} from "@/lib/server/auth/session";
import { getCommunicationWorkspaceData } from "@/lib/server/communication-service";

type CommunicationPageProps = {
  params: Promise<{ organizationSlug: string }>;
  searchParams: Promise<{ channel?: string }>;
};

export default async function CommunicationPage({
  params,
  searchParams,
}: CommunicationPageProps) {
  const [{ organizationSlug }, { channel }] = await Promise.all([
    params,
    searchParams,
  ]);
  const context = await requireOrganizationContext(organizationSlug);
  const data = await getCommunicationWorkspaceData(
    context.organizationId,
    context.user.id,
    channel,
  );

  return (
    <CommunicationWorkspace
      organizationSlug={organizationSlug}
      canMutate={hasWorkspacePermission(context.role, "change")}
      data={data}
    />
  );
}
