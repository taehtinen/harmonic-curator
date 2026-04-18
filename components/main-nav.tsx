"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import SignOutButton from "@/components/sign-out-button";

const mainTabs = [
  { href: "/", label: "Shoutbox" },
  { href: "/artists", label: "Artists" },
  { href: "/playlists", label: "Playlists" },
] as const;

const usersTab = { href: "/users", label: "Users" } as const;

const settingsTab = { href: "/settings", label: "Settings" } as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function navLinkClass(active: boolean) {
  return active
    ? "rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium uppercase tracking-wide text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
    : "rounded-lg px-4 py-2 text-sm font-medium uppercase tracking-wide text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200";
}

export default function MainNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const usersActive = isActive(pathname, usersTab.href);
  const settingsActive = isActive(pathname, settingsTab.href);

  return (
    <nav
      className="shrink-0 border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-950"
      aria-label="Main menu"
    >
      <div className="flex flex-wrap items-center gap-1">
        <div className="flex flex-wrap items-center gap-1">
          {mainTabs.map(({ href, label }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={navLinkClass(active)}
              >
                {label}
              </Link>
            );
          })}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-1">
          {isAdmin ? (
            <Link
              href={usersTab.href}
              aria-current={usersActive ? "page" : undefined}
              className={navLinkClass(usersActive)}
            >
              {usersTab.label}
            </Link>
          ) : null}
          <Link
            href={settingsTab.href}
            aria-current={settingsActive ? "page" : undefined}
            className={navLinkClass(settingsActive)}
          >
            {settingsTab.label}
          </Link>
          <SignOutButton />
        </div>
      </div>
    </nav>
  );
}
