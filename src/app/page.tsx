import { BusinessWorkspace } from "@/components/pages/business-workspace/business-workspace";
import { getWorkspaceData } from "@/lib/server/workspace-service";

export const dynamic = "force-dynamic";

type HomeProps = {
  searchParams: Promise<{
    entity?: string | string[];
    change?: string | string[];
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const query = await searchParams;
  const workspace = await getWorkspaceData({
    entityId: firstQueryValue(query.entity),
    changeSetId: firstQueryValue(query.change),
  });
  const workspaceKey =
    workspace.changeResult?.id ?? workspace.selectedEntity.id;

  return <BusinessWorkspace key={workspaceKey} workspace={workspace} />;
}

function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
