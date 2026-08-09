import { sqlClient } from "@/lib/server/database/client";
import { seedDemoState } from "@/lib/server/database/demo-state";

async function main() {
  try {
    const result = await seedDemoState();
    console.log(
      result.created ? "Demo state created." : "Demo state already exists.",
    );
  } finally {
    await sqlClient.end();
  }
}

void main();
