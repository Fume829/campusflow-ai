import { redirect } from "next/navigation";
import { Dashboard } from "./components/dashboard";
import { createClient } from "@/lib/supabase/server";
import { assignmentRowToAssignment, assignmentSelectColumns } from "./lib/assignments";

export default async function Home() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (error || !claims) redirect("/login");

  const userId = typeof claims.sub === "string" ? claims.sub : null;
  if (!userId) redirect("/login");

  const userEmail = typeof claims.email === "string" ? claims.email : "ログイン中";

  const { error: recurringGenerationError } = await supabase.rpc(
    "generate_recurring_assignments",
  );

  const { data: assignmentRows, error: assignmentError } = await supabase
    .from("assignments")
    .select(assignmentSelectColumns)
    .order("due_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  const initialAssignments = assignmentError
    ? []
    : (assignmentRows ?? []).map(assignmentRowToAssignment);

  return (
    <Dashboard
      userEmail={userEmail}
      userId={userId}
      initialAssignments={initialAssignments}
      initialLoadError={
        assignmentError
          ? "課題を読み込めませんでした。時間をおいて再読み込みしてください。"
          : recurringGenerationError
            ? "毎週課題の次回分を生成できませんでした。時間をおいて再読み込みしてください。"
            : undefined
      }
    />
  );
}