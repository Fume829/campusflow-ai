import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "../components/auth/auth-shell";
import { SignupForm } from "../components/auth/signup-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "新規登録 | CampusFlow AI",
};

export default async function SignupPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims) redirect("/");

  return (
    <AuthShell
      title="新規登録"
      description="CampusFlow AIを使って、大学の課題をまとめて管理しましょう。"
      footerText="すでにアカウントをお持ちの方は"
      footerLinkLabel="ログイン"
      footerHref="/login"
    >
      <SignupForm />
    </AuthShell>
  );
}
