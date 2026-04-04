import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  if (await getCurrentUser()) {
    redirect("/");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 px-6 py-16 font-sans dark:bg-black">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Sign in
      </h1>
      <p className="max-w-md text-center text-sm text-zinc-600 dark:text-zinc-400">
        Authentication is not wired up yet. Once login is implemented, you will sign in here to use
        harmonic-curator.
      </p>
    </div>
  );
}
