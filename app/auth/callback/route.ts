import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function getSafeInternalPath(value: string | null, origin: string): string {
  if (!value?.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/";

  const destination = new URL(value, origin);
  if (destination.origin !== origin) return "/";

  return `${destination.pathname}${destination.search}${destination.hash}`;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = getSafeInternalPath(requestUrl.searchParams.get("next"), requestUrl.origin);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
    }
  }

  const loginUrl = new URL("/login", requestUrl.origin);
  loginUrl.searchParams.set("error", code ? "callback_failed" : "missing_code");
  return NextResponse.redirect(loginUrl);
}
