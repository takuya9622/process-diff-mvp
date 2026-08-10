export const SIGN_IN_PATH = "/sign-in";
export const SIGN_UP_PATH = "/sign-up";
export const ONBOARDING_PATH = "/onboarding";

export function createOrganizationPath(organizationSlug: string) {
  return `/organizations/${encodeURIComponent(organizationSlug)}`;
}

export function createDocumentLibraryPath(organizationSlug: string) {
  return `${createOrganizationPath(organizationSlug)}/documents`;
}

export function createCommunicationPath(
  organizationSlug: string,
  channelId?: string,
) {
  const path = `${createOrganizationPath(organizationSlug)}/communication`;
  return channelId ? `${path}?channel=${encodeURIComponent(channelId)}` : path;
}

export function createEntityPath(
  organizationSlug: string,
  businessEntityId: string,
) {
  return `${createOrganizationPath(organizationSlug)}/entities/${encodeURIComponent(businessEntityId)}`;
}

export function createWorkflowCatalogPath(organizationSlug: string) {
  return `${createOrganizationPath(organizationSlug)}/workflows`;
}

export function createWorkflowStartPath(
  organizationSlug: string,
  workflowDefinitionId: string,
) {
  return `${createWorkflowCatalogPath(organizationSlug)}/${encodeURIComponent(workflowDefinitionId)}/start`;
}

export function createCasesPath(organizationSlug: string) {
  return `${createOrganizationPath(organizationSlug)}/cases`;
}

export function createCasePath(organizationSlug: string, caseId: string) {
  return `${createCasesPath(organizationSlug)}/${encodeURIComponent(caseId)}`;
}

export function createWorkItemPath(
  organizationSlug: string,
  caseId: string,
  workItemId: string,
) {
  return `${createCasePath(organizationSlug, caseId)}/work-items/${encodeURIComponent(workItemId)}`;
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
