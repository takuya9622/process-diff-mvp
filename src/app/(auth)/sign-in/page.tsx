import { redirect } from "next/navigation";

import { SignInForm } from "@/app/(auth)/sign-in/sign-in-form";
import { sanitizeReturnTo } from "@/constants/routes";
import { getSession } from "@/lib/server/auth/session";

type SignInPageProps = {
  searchParams: Promise<{ returnTo?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  if (await getSession()) {
    redirect("/");
  }

  const { returnTo } = await searchParams;

  return <SignInForm returnTo={sanitizeReturnTo(returnTo)} />;
}
