import { redirect } from "next/navigation";

import { OnboardingForm } from "@/app/onboarding/onboarding-form";
import { ONBOARDING_PATH } from "@/constants/routes";
import { requireSession } from "@/lib/server/auth/session";

export default async function OnboardingPage() {
  const session = await requireSession(ONBOARDING_PATH);

  if (!session.user) {
    redirect("/sign-in");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <section className="w-full max-w-xl rounded-3xl border border-outline bg-surface p-6 shadow-panel sm:p-10">
        <p className="text-xs font-bold tracking-[0.12em] text-action-primary uppercase">
          Initial setup
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-content-primary">
          組織ワークスペースを作成
        </h1>
        <p className="mt-3 text-sm leading-7 text-content-secondary">
          Process
          Diffで変更対象と影響候補を共有する単位です。MVPでは1アカウントにつき1組織を作成できます。
        </p>
        <OnboardingForm defaultName={`${session.user.name}の組織`} />
      </section>
    </main>
  );
}
