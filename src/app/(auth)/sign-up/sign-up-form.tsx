"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/general/button";
import { ONBOARDING_PATH, SIGN_IN_PATH } from "@/constants/routes";
import { authClient } from "@/lib/auth/client";

export function SignUpForm() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function submit(formData: FormData) {
    const name = String(formData.get("name")).trim();
    const email = String(formData.get("email")).trim();
    const password = String(formData.get("password"));
    const passwordConfirmation = String(formData.get("passwordConfirmation"));

    if (password !== passwordConfirmation) {
      setErrorMessage("確認用パスワードが一致していません。");
      return;
    }

    setIsPending(true);
    setErrorMessage(null);
    const result = await authClient.signUp.email({ name, email, password });

    if (result.error) {
      setErrorMessage(
        "登録できませんでした。入力内容を確認するか、登録済みの場合はログインしてください。",
      );
      setIsPending(false);
      return;
    }

    router.push(ONBOARDING_PATH);
    router.refresh();
  }

  return (
    <>
      <div>
        <p className="text-xs font-bold tracking-[0.12em] text-action-primary uppercase">
          Sign up
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-content-primary">
          アカウントを作成
        </h1>
        <p className="mt-2 text-sm leading-6 text-content-secondary">
          登録後に、最初の業務知識ワークスペースを作成します。
        </p>
      </div>

      <form action={submit} className="mt-7 space-y-5">
        <SignUpField label="名前" name="name" autoComplete="name" />
        <SignUpField
          label="メールアドレス"
          name="email"
          type="email"
          autoComplete="email"
        />
        <SignUpField
          label="パスワード"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          hint="12文字以上"
        />
        <SignUpField
          label="パスワード（確認）"
          name="passwordConfirmation"
          type="password"
          autoComplete="new-password"
          minLength={12}
        />
        {errorMessage ? (
          <p
            role="alert"
            className="text-sm font-semibold text-status-danger-content"
          >
            {errorMessage}
          </p>
        ) : null}
        <Button className="w-full" disabled={isPending} type="submit">
          {isPending ? "登録しています…" : "新規登録"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-content-secondary">
        登録済みの方は
        <Link
          className="ml-1 font-semibold text-action-primary hover:underline"
          href={SIGN_IN_PATH}
        >
          ログイン
        </Link>
      </p>
    </>
  );
}

function SignUpField({
  label,
  name,
  type = "text",
  autoComplete,
  minLength,
  hint,
}: {
  label: string;
  name: string;
  type?: "text" | "email" | "password";
  autoComplete: string;
  minLength?: number;
  hint?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-content-primary">
      <span className="flex items-center justify-between gap-3">
        {label}
        {hint ? (
          <span className="font-normal text-content-tertiary">{hint}</span>
        ) : null}
      </span>
      <input
        className="mt-2 min-h-12 w-full rounded-xl border border-outline-strong bg-surface px-4 text-base font-normal focus:border-action-primary focus:ring-2 focus:ring-focus-ring/30 focus:outline-none"
        name={name}
        type={type}
        autoComplete={autoComplete}
        minLength={minLength}
        maxLength={type === "password" ? 128 : undefined}
        required
      />
    </label>
  );
}
