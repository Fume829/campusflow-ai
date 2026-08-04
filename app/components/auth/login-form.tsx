"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type LoginFormProps = {
  initialMessage?: string;
};

type LoginErrors = Partial<Record<"email" | "password" | "form", string>>;

const inputClassName =
  "mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-base text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";

export function LoginForm({ initialMessage }: LoginFormProps) {
  const router = useRouter();
  const [supabase] = useState(createClient);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim();
    const nextErrors: LoginErrors = {};

    if (!normalizedEmail) nextErrors.email = "メールアドレスを入力してください。";
    if (!password) nextErrors.password = "パスワードを入力してください。";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        setErrors({ form: "メールアドレスまたはパスワードを確認してください。" });
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setErrors({ form: "ログインできませんでした。時間をおいてもう一度お試しください。" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {initialMessage && (
        <p role="alert" className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium leading-6 text-amber-800">
          {initialMessage}
        </p>
      )}
      {errors.form && (
        <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium leading-6 text-rose-700">
          {errors.form}
        </p>
      )}

      <label className="block text-sm font-bold text-slate-700">
        メールアドレス
        <input
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setErrors((current) => ({ ...current, email: undefined, form: undefined }));
          }}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "login-email-error" : undefined}
          placeholder="student@example.com"
          className={inputClassName}
        />
        {errors.email && <span id="login-email-error" className="mt-1.5 block text-xs font-medium text-rose-600">{errors.email}</span>}
      </label>

      <label className="block text-sm font-bold text-slate-700">
        パスワード
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setErrors((current) => ({ ...current, password: undefined, form: undefined }));
          }}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "login-password-error" : undefined}
          className={inputClassName}
        />
        {errors.password && <span id="login-password-error" className="mt-1.5 block text-xs font-medium text-rose-600">{errors.password}</span>}
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="min-h-12 w-full rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "ログイン中…" : "ログイン"}
      </button>
    </form>
  );
}
