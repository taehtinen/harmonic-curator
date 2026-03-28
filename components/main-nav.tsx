"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Artists" },
  { href: "/playlists", label: "Playlists" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function MainNav() {
  const pathname = usePathname();

  return (
    <nav
      className="shrink-0 border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-950"
      aria-label="Main menu"
    >
      <div className="flex gap-1">
        {tabs.map(({ href, label }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                  : "rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
              }
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
