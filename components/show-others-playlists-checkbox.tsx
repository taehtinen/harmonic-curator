"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition, type ChangeEvent } from "react";

export default function ShowOthersPlaylistsCheckbox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const showOthers = searchParams.get("others") !== "0";

  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const next = new URLSearchParams(searchParams.toString());
      if (e.target.checked) {
        next.delete("others");
      } else {
        next.set("others", "0");
      }
      const qs = next.toString();
      startTransition(() => {
        router.push(qs ? `/playlists?${qs}` : "/playlists");
      });
    },
    [router, searchParams],
  );

  return (
    <label
      className={`flex shrink-0 cursor-pointer select-none items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 ${
        isPending ? "opacity-60" : ""
      }`}
    >
      <input
        type="checkbox"
        checked={showOthers}
        onChange={onChange}
        className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
      />
      <span>Show others playlists</span>
    </label>
  );
}
