import { sqlClient } from "@/lib/server/database/client";
import { resetDemoState } from "@/lib/server/database/demo-state";
import { isUuid } from "@/lib/domain/identifier";

async function main() {
  try {
    await resetDemoState(requireOrganizationId());
    console.log("Demo state reset.");
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
