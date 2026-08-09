import { sqlClient } from "@/lib/server/database/client";
import { seedDemoState } from "@/lib/server/database/demo-state";
import { isUuid } from "@/lib/domain/identifier";

async function main() {
  try {
    const result = await seedDemoState(requireOrganizationId());
    console.log(
      result.created ? "Demo state created." : "Demo state already exists.",
    );
  } finally {
    await sqlClient.end();
  }
}

function requireOrganizationId() {
  const organizationId = process.env.ORGANIZATION_ID;

  if (!organizationId || !isUuid(organizationId)) {
    throw new Error("ORGANIZATION_ID must be a valid organization UUID.");
  }

  return organizationId;
}

void main();
