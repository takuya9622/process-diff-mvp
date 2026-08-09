import { redirect } from "next/navigation";

import {
  createOrganizationPath,
  ONBOARDING_PATH,
  SIGN_IN_PATH,
} from "@/constants/routes";
import {
  getCurrentOrganizationMemberships,
  getSession,
} from "@/lib/server/auth/session";

export default async function Home() {
  if (!(await getSession())) {
    redirect(SIGN_IN_PATH);
  }

  const [membership] = await getCurrentOrganizationMemberships();

  if (!membership) {
    redirect(ONBOARDING_PATH);
  }

  redirect(createOrganizationPath(membership.organizationSlug));
}
