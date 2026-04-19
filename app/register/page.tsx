import Link from "next/link";
import { redirect } from "next/navigation";

import RegisterForm from "@/components/register-form";
import { getCurrentUser } from "@/lib/auth";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ username?: string; registrationToken?: string }>;
}) {
  if (await getCurrentUser()) {
    redirect("/");
  }

  const params = await searchParams;
  const username = String(params.username ?? "").trim();
  const registrationToken = String(params.registrationToken ?? "").trim();

  if (!username || !registrationToken) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-50 px-6 py-16 font-sans dark:bg-black">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Invalid registration link
        </h1>
        <p className="max-w-sm text-center text-sm text-zinc-600 dark:text-zinc-400">
          This link is missing required information or has expired. Ask for a
          new invite or sign in if you already have an account.
        </p>
        <Link
          href="/login"
          className="text-sm font-medium text-zinc-900 underline underline-offset-4 hover:text-zinc-700 dark:text-zinc-50 dark:hover:text-zinc-200"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-50 px-6 py-16 font-sans dark:bg-black">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Complete registration
      </h1>
      <RegisterForm username={username} registrationToken={registrationToken} />
    </div>
  );
}
