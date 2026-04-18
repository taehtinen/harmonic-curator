import MainNav from "@/components/main-nav";
import { requireUser, userIsAdmin } from "@/lib/auth";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireUser();

  return (
    <>
      <MainNav isAdmin={userIsAdmin(user)} />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </>
  );
}
