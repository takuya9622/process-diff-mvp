"use server";

import { randomUUID } from "node:crypto";

import { headers } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";

import { createOrganizationPath } from "@/constants/routes";
import { countUnicodeCodePoints } from "@/lib/domain/text";
import { auth } from "@/lib/server/auth";
import {
  getCurrentOrganizationMemberships,
  requireSession,
} from "@/lib/server/auth/session";
import { seedDemoState } from "@/lib/server/database/demo-state";
import type { CreateOrganizationResult } from "@/types/actions";

export async function createOrganizationAction(
  _previousState: CreateOrganizationResult,
  formData: FormData,
): Promise<CreateOrganizationResult> {
  const session = await requireSession("/onboarding");
  const name = String(formData.get("name") ?? "").trim();
  const nameLength = countUnicodeCodePoints(name);

  if (nameLength < 2 || nameLength > 80) {
    return {
      status: "invalid",
      message: "組織名は2文字以上80文字以内で入力してください。",
    };
  }

  try {
    const [existingMembership] = await getCurrentOrganizationMemberships();

    if (existingMembership) {
      await activateAndSeedOrganization(
        existingMembership.organizationId,
        existingMembership.organizationSlug,
      );
      redirect(createOrganizationPath(existingMembership.organizationSlug));
    }

    const organization = await auth.api.createOrganization({
      headers: await headers(),
      body: {
        name,
        slug: createOrganizationSlug(name),
        userId: session.user.id,
        keepCurrentActiveOrganization: false,
      },
    });

    await seedDemoState(organization.id);
    redirect(createOrganizationPath(organization.slug));
  } catch (error) {
    unstable_rethrow(error);

    console.error("Failed to create an organization.", error);
    return {
      status: "error",
      message:
        "組織ワークスペースを作成できませんでした。時間をおいてもう一度お試しください。",
    };
  }
}

async function activateAndSeedOrganization(
  organizationId: string,
  organizationSlug: string,
) {
  await auth.api.setActiveOrganization({
    headers: await headers(),
    body: { organizationId },
  });
  await seedDemoState(organizationId);
  return organizationSlug;
}

function createOrganizationSlug(name: string) {
  const prefix = name
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);

  return `${prefix || "workspace"}-${randomUUID().slice(0, 8)}`;
}
