import { cache } from "react";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import {
  organizationRoles,
  type OrganizationRole,
} from "@/lib/auth/access-control";
import { createSignInPath } from "@/constants/routes";
import { auth } from "@/lib/server/auth";
import {
  organizationMemberships,
  organizations,
} from "@/lib/server/database/auth-schema.generated";
import { database } from "@/lib/server/database/client";

export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);

export const getCurrentOrganizationMemberships = cache(async () => {
  const session = await getSession();

  if (!session) {
    return [];
  }

  const rows = await database
    .select({
      organizationId: organizations.id,
      organizationName: organizations.name,
      organizationSlug: organizations.slug,
      role: organizationMemberships.role,
    })
    .from(organizationMemberships)
    .innerJoin(
      organizations,
      eq(organizationMemberships.organizationId, organizations.id),
    )
    .where(eq(organizationMemberships.userId, session.user.id));

  return rows.flatMap((row) => {
    const role = parseOrganizationRole(row.role);
    return role ? [{ ...row, role }] : [];
  });
});

export const getOrganizationContext = cache(
  async (organizationSlug: string) => {
    const session = await getSession();

    if (!session) {
      return null;
    }

    const [membership] = await database
      .select({
        organizationId: organizations.id,
        organizationName: organizations.name,
        organizationSlug: organizations.slug,
        role: organizationMemberships.role,
      })
      .from(organizationMemberships)
      .innerJoin(
        organizations,
        eq(organizationMemberships.organizationId, organizations.id),
      )
      .where(
        and(
          eq(organizationMemberships.userId, session.user.id),
          eq(organizations.slug, organizationSlug),
        ),
      )
      .limit(1);

    const role = membership && parseOrganizationRole(membership.role);

    if (!membership || !role) {
      return null;
    }

    return {
      ...membership,
      role,
      user: session.user,
    };
  },
);

export async function requireSession(returnTo?: string) {
  const session = await getSession();

  if (!session) {
    redirect(createSignInPath(returnTo));
  }

  return session;
}

export async function requireOrganizationContext(organizationSlug: string) {
  const session = await getSession();

  if (!session) {
    redirect(createSignInPath(`/organizations/${organizationSlug}`));
  }

  const context = await getOrganizationContext(organizationSlug);

  if (!context) {
    notFound();
  }

  return context;
}

export function hasWorkspacePermission(
  role: OrganizationRole,
  action: "read" | "change" | "reset",
) {
  return organizationRoles[role].authorize({
    workspace: [action],
  }).success;
}

function parseOrganizationRole(value: string): OrganizationRole | null {
  return value === "owner" || value === "editor" || value === "viewer"
    ? value
    : null;
}
