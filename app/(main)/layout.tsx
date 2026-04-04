import MainNav from "@/components/main-nav";
import { requireUser } from "@/lib/auth";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireUser();

  return (
    <>
      <MainNav />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </>
  );
}
