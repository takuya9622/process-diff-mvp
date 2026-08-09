import { sqlClient } from "@/lib/server/database/client";
import { resetDemoState } from "@/lib/server/database/demo-state";

async function main() {
  try {
    await resetDemoState();
    console.log("Demo state reset.");
  } finally {
    await sqlClient.end();
  }
}

void main();
