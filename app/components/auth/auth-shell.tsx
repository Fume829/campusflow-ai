import Link from "next/link";

type AuthShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  footerText: string;
  footerLinkLabel: string;
  footerHref: "/login" | "/signup";
};

export function AuthShell({
  title,
  description,
  children,
  footerText,
  footerLinkLabel,
  footerHref,
}: AuthShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fc] px-4 py-10 text-slate-900 sm:px-6">
      <div className="w-full max-w-md">
        <div className="mb-7 flex items-center justify-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-indigo-600 text-sm font-black text-white shadow-sm shadow-indigo-200">
            CF
          </div>
          <div>
            <p className="text-xl font-extrabold tracking-tight text-slate-950">CampusFlow AI</p>
            <p className="text-xs font-medium text-slate-400">学びを、もっとスムーズに。</p>
          </div>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="text-center">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
          </div>
          <div className="mt-7">{children}</div>
          <p className="mt-7 border-t border-slate-100 pt-6 text-center text-sm text-slate-500">
            {footerText}{" "}
            <Link
              href={footerHref}
              className="font-bold text-indigo-600 underline-offset-4 hover:text-indigo-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              {footerLinkLabel}
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
