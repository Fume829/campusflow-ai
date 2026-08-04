"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type SignupErrors = Partial<Record<"email" | "password" | "passwordConfirmation" | "form", string>>;

const inputClassName =
  "mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-base text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";

export function SignupForm() {
  const router = useRouter();
  const [supabase] = useState(createClient);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [errors, setErrors] = useState<SignupErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim();
    const nextErrors: SignupErrors = {};

    if (!normalizedEmail) nextErrors.email = "メールアドレスを入力してください。";
    if (!password) nextErrors.password = "パスワードを入力してください。";
    else if (password.length < 8) nextErrors.password = "パスワードは8文字以上で入力してください。";
    if (!passwordConfirmation) nextErrors.passwordConfirmation = "確認用パスワードを入力してください。";
    else if (password !== passwordConfirmation) nextErrors.passwordConfirmation = "パスワードが一致しません。";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setSuccessMessage(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setErrors({ form: "新規登録できませんでした。入力内容を確認してもう一度お試しください。" });
        return;
      }

      if (data.session) {
        router.replace("/");
        router.refresh();
        return;
      }

      setPassword("");
      setPasswordConfirmation("");
      setSuccessMessage("確認メールを送信しました。メール内のリンクを開いて登録を完了してください。");
    } catch {
      setErrors({ form: "新規登録できませんでした。時間をおいてもう一度お試しください。" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {successMessage && (
        <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium leading-6 text-emerald-800">
          {successMessage}
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
          aria-describedby={errors.email ? "signup-email-error" : undefined}
          placeholder="student@example.com"
          className={inputClassName}
        />
        {errors.email && <span id="signup-email-error" className="mt-1.5 block text-xs font-medium text-rose-600">{errors.email}</span>}
      </label>

      <label className="block text-sm font-bold text-slate-700">
        パスワード
        <input
          type="password"
          name="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setErrors((current) => ({ ...current, password: undefined, passwordConfirmation: undefined, form: undefined }));
          }}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "signup-password-error" : "signup-password-help"}
          className={inputClassName}
        />
        <span id="signup-password-help" className="mt-1.5 block text-xs text-slate-400">8文字以上で入力してください。</span>
        {errors.password && <span id="signup-password-error" className="mt-1.5 block text-xs font-medium text-rose-600">{errors.password}</span>}
      </label>

      <label className="block text-sm font-bold text-slate-700">
        確認用パスワード
        <input
          type="password"
          name="passwordConfirmation"
          autoComplete="new-password"
          value={passwordConfirmation}
          onChange={(event) => {
            setPasswordConfirmation(event.target.value);
            setErrors((current) => ({ ...current, passwordConfirmation: undefined, form: undefined }));
          }}
          aria-invalid={Boolean(errors.passwordConfirmation)}
          aria-describedby={errors.passwordConfirmation ? "signup-password-confirmation-error" : undefined}
          className={inputClassName}
        />
        {errors.passwordConfirmation && (
          <span id="signup-password-confirmation-error" className="mt-1.5 block text-xs font-medium text-rose-600">
            {errors.passwordConfirmation}
          </span>
        )}
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="min-h-12 w-full rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "登録中…" : "新規登録"}
      </button>
    </form>
  );
}
