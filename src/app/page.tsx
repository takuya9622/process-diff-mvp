import { redirect } from "next/navigation";

import {
  createOrganizationPath,
  CURRENT_DEMO_ORGANIZATION_SLUG,
} from "@/constants/routes";

export default function Home() {
  redirect(createOrganizationPath(CURRENT_DEMO_ORGANIZATION_SLUG));
}
