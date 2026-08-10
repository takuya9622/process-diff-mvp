export const SIGN_IN_PATH = "/sign-in";
export const SIGN_UP_PATH = "/sign-up";
export const ONBOARDING_PATH = "/onboarding";

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

export function createSignInPath(returnTo?: string) {
  if (!returnTo) {
    return SIGN_IN_PATH;
  }

  return `${SIGN_IN_PATH}?returnTo=${encodeURIComponent(returnTo)}`;
}

export function sanitizeReturnTo(value: string | undefined) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}
