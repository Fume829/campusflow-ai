import { redirect } from "next/navigation";
import { Dashboard } from "./components/dashboard";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (error || !claims) redirect("/login");

  const userEmail = typeof claims.email === "string" ? claims.email : "ログイン中";

  return <Dashboard userEmail={userEmail} />;
}
