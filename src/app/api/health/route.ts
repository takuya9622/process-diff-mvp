import { sqlClient } from "@/lib/server/database/client";

export async function GET() {
  try {
    await sqlClient`
      select 1
      from workflow_definitions, communication_channels
      limit 0
    `;

    return Response.json(
      { status: "ok" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { status: "error" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
