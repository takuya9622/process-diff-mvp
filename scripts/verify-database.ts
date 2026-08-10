import { and, count, eq, inArray } from "drizzle-orm";
import { readMigrationFiles } from "drizzle-orm/migrator";

import { INITIAL_DEMO_ENTITY_NAME } from "@/constants/demo";
import { organizations } from "@/lib/server/database/auth-schema.generated";
import { DEMO_COMMUNICATION_CHANNEL_SEEDS } from "@/lib/server/database/communication-seed-data";
import { database, sqlClient } from "@/lib/server/database/client";
import {
  businessEntities,
  communicationChannels,
  workflowDefinitions,
} from "@/lib/server/database/schema";
import { EXPENSE_WORKFLOW_KEY } from "@/lib/server/database/workflow-seed-data";

type AppliedMigration = {
  created_at: string;
  hash: string;
};

async function main() {
  try {
    await verifyMigrations();
    const organizationCount = await verifyOrganizationSeedState();
    const migrationCount = readMigrationFiles({
      migrationsFolder: "drizzle",
    }).length;

    console.log(
      `Database verification completed: ${migrationCount} migration(s), ${organizationCount} organization(s).`,
    );
  } finally {
    await sqlClient.end();
  }
}

async function verifyMigrations() {
  const expectedMigrations = readMigrationFiles({
    migrationsFolder: "drizzle",
  });
  const appliedMigrations = await sqlClient<AppliedMigration[]>`
    select hash, created_at::text
    from drizzle.__drizzle_migrations
    order by created_at asc
  `;

  if (appliedMigrations.length !== expectedMigrations.length) {
    throw new Error(
      `Migration verification failed: expected ${expectedMigrations.length}, found ${appliedMigrations.length}.`,
    );
  }

  for (const [index, expectedMigration] of expectedMigrations.entries()) {
    const appliedMigration = appliedMigrations[index];

    if (
      !appliedMigration ||
      appliedMigration.hash !== expectedMigration.hash ||
      appliedMigration.created_at !== String(expectedMigration.folderMillis)
    ) {
      throw new Error(
        `Migration verification failed at position ${index + 1}.`,
      );
    }
  }
}

async function verifyOrganizationSeedState() {
  const organizationRows = await database
    .select({ id: organizations.id })
    .from(organizations);
  const channelKeys = DEMO_COMMUNICATION_CHANNEL_SEEDS.map(
    (channel) => channel.key,
  );
  let incompleteOrganizationCount = 0;

  for (const organization of organizationRows) {
    const [initialEntityResult, workflowResult, channelResult] =
      await Promise.all([
        database
          .select({ value: count() })
          .from(businessEntities)
          .where(
            and(
              eq(businessEntities.organizationId, organization.id),
              eq(businessEntities.name, INITIAL_DEMO_ENTITY_NAME),
            ),
          ),
        database
          .select({ value: count() })
          .from(workflowDefinitions)
          .where(
            and(
              eq(workflowDefinitions.organizationId, organization.id),
              eq(workflowDefinitions.definitionKey, EXPENSE_WORKFLOW_KEY),
            ),
          ),
        database
          .select({ value: count() })
          .from(communicationChannels)
          .where(
            and(
              eq(communicationChannels.organizationId, organization.id),
              inArray(communicationChannels.channelKey, channelKeys),
            ),
          ),
      ]);

    const hasCompleteSeedState =
      initialEntityResult[0]?.value === 1 &&
      workflowResult[0]?.value === 1 &&
      channelResult[0]?.value === channelKeys.length;

    if (!hasCompleteSeedState) {
      incompleteOrganizationCount += 1;
    }
  }

  if (incompleteOrganizationCount > 0) {
    throw new Error(
      `Seed verification failed for ${incompleteOrganizationCount} organization(s).`,
    );
  }

  return organizationRows.length;
}

void main();
