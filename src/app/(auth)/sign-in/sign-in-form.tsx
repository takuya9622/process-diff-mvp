"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/general/button";
import { SIGN_UP_PATH } from "@/constants/routes";
import { authClient } from "@/lib/auth/client";

export function SignInForm({ returnTo }: { returnTo: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function submit(formData: FormData) {
    setIsPending(true);
    setErrorMessage(null);

    const result = await authClient.signIn.email({
      email: String(formData.get("email")),
      password: String(formData.get("password")),
    });

    if (result.error) {
      setErrorMessage(
        "メールアドレスまたはパスワードを確認して、もう一度お試しください。",
      );
      setIsPending(false);
      return;
    }

    router.push(returnTo);
    router.refresh();
  }

  return (
    <>
      <div>
        <p className="text-xs font-bold tracking-[0.12em] text-action-primary uppercase">
          Sign in
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-content-primary">
          ログイン
        </h1>
        <p className="mt-2 text-sm leading-6 text-content-secondary">
          あなたの組織のワークスペースを開きます。
        </p>
      </div>

      <form action={submit} className="mt-7 space-y-5">
        <AuthField label="メールアドレス" name="email" type="email" />
        <AuthField label="パスワード" name="password" type="password" />
        {errorMessage ? (
          <p
            role="alert"
            className="text-sm font-semibold text-status-danger-content"
          >
            {errorMessage}
          </p>
        ) : null}
        <Button className="w-full" disabled={isPending} type="submit">
          {isPending ? "ログインしています…" : "ログイン"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-content-secondary">
        アカウントをお持ちでない方は
        <Link
          className="ml-1 font-semibold text-action-primary hover:underline"
          href={SIGN_UP_PATH}
        >
          新規登録
        </Link>
      </p>
    </>
  );
}

function AuthField({
  label,
  name,
  type,
}: {
  label: string;
  name: string;
  type: "email" | "password";
}) {
  return (
    <label className="block text-sm font-semibold text-content-primary">
      {label}
      <input
        className="mt-2 min-h-12 w-full rounded-xl border border-outline-strong bg-surface px-4 text-base font-normal focus:border-action-primary focus:ring-2 focus:ring-focus-ring/30 focus:outline-none"
        name={name}
        type={type}
        autoComplete={type === "email" ? "email" : "current-password"}
        required
      />
    </label>
  );
}
