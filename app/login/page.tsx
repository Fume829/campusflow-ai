import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "../components/auth/auth-shell";
import { LoginForm } from "../components/auth/login-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "ログイン | CampusFlow AI",
};

const errorMessages: Record<string, string> = {
  missing_code: "認証リンクを確認できませんでした。もう一度お試しください。",
  callback_failed: "認証を完了できませんでした。もう一度ログインしてください。",
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims) redirect("/");

  const params = await searchParams;
  const errorCode = typeof params.error === "string" ? params.error : undefined;
  const initialMessage = errorCode
    ? errorMessages[errorCode] ?? "ログイン処理を完了できませんでした。もう一度お試しください。"
    : undefined;

  return (
    <AuthShell
      title="ログイン"
      description="課題と締切を確認するためにログインしてください。"
      footerText="アカウントをお持ちでない方は"
      footerLinkLabel="新規登録"
      footerHref="/signup"
    >
      <LoginForm initialMessage={initialMessage} />
    </AuthShell>
  );
}
