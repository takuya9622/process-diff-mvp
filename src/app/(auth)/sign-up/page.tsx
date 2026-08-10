import { redirect } from "next/navigation";

import { SignUpForm } from "@/app/(auth)/sign-up/sign-up-form";
import { getSession } from "@/lib/server/auth/session";

export default async function SignUpPage() {
  if (await getSession()) {
    redirect("/");
  }

  return <SignUpForm />;
}
