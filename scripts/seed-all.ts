import { asc } from "drizzle-orm";

import { sqlClient, database } from "@/lib/server/database/client";
import { organizations } from "@/lib/server/database/auth-schema.generated";
import { seedDemoState } from "@/lib/server/database/demo-state";

async function main() {
  try {
    const organizationRows = await database
      .select({ id: organizations.id })
      .from(organizations)
      .orderBy(asc(organizations.createdAt), asc(organizations.id));
    let initializedOrganizationCount = 0;

    for (const [index, organization] of organizationRows.entries()) {
      try {
        const result = await seedDemoState(organization.id);

        if (result.created) {
          initializedOrganizationCount += 1;
        }
      } catch (error) {
        throw new Error(
          `Failed to reconcile seed state for organization ${index + 1} of ${organizationRows.length}.`,
          { cause: error },
        );
      }
    }

    console.log(
      `Seed reconciliation completed for ${organizationRows.length} organization(s); ${initializedOrganizationCount} organization(s) initialized.`,
    );
  } finally {
    await sqlClient.end();
  }
}

void main();
