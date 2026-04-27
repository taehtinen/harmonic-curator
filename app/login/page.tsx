import { redirect } from "next/navigation";
import LoginForm from "@/components/login-form";
import Logo from "@/components/logo";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  if (await getCurrentUser()) {
    redirect("/");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-50 px-6 py-16 font-sans dark:bg-black">
      <Logo />
      <p className="mb-3 bg-gradient-to-r from-violet-500 to-sky-500 bg-clip-text text-3xl font-bold tracking-tight text-transparent dark:from-violet-400 dark:to-sky-400">
        Harmonic Curator
      </p>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Sign in
      </h1>
      <LoginForm />
    </div>
  );
}
