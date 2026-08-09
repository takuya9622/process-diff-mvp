export const CURRENT_DEMO_ORGANIZATION_SLUG = "shared-demo";

export function createOrganizationPath(organizationSlug: string) {
  return `/organizations/${encodeURIComponent(organizationSlug)}`;
}

export function createEntityPath(
  organizationSlug: string,
  businessEntityId: string,
) {
  return `${createOrganizationPath(organizationSlug)}/entities/${encodeURIComponent(businessEntityId)}`;
}

export function createChangePath(
  organizationSlug: string,
  changeSetId: string,
) {
  return `${createOrganizationPath(organizationSlug)}/changes/${encodeURIComponent(changeSetId)}`;
}

export function isCurrentDemoOrganization(organizationSlug: string) {
  return organizationSlug === CURRENT_DEMO_ORGANIZATION_SLUG;
}
