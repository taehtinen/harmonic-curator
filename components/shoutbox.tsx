import ShoutboxForm from "@/components/shoutbox-form";
import { listShoutsForHome } from "@/lib/shoutbox";

function formatShoutTimestamp(d: Date) {
  const date = d.toLocaleDateString(undefined, { dateStyle: "short" });
  const time = d.toLocaleTimeString(undefined, { timeStyle: "short" });
  return `${date} ${time}`;
}

export default async function Shoutbox() {
  const rows = await listShoutsForHome();

  return (
    <section
      className="flex min-h-0 flex-1 flex-col"
      aria-label="Shoutbox"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {rows.length === 0 ? (
            <p className="font-mono text-sm text-zinc-500 dark:text-zinc-400">
              No messages yet — be the first.
            </p>
          ) : (
            <ul className="list-none space-y-1 font-mono text-sm text-zinc-700 dark:text-zinc-300">
              {rows.map((row) => (
                <li key={row.id}>
                  <p className="break-words">
                    <time
                      className="tabular-nums text-zinc-500 dark:text-zinc-400"
                      dateTime={row.createdAt.toISOString()}
                    >
                      {formatShoutTimestamp(row.createdAt)}
                    </time>{" "}
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      {"<"}
                      {row.username}
                      {">"}
                    </span>{" "}
                    {row.body}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="shrink-0 border-t border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50 sm:px-6">
          <ShoutboxForm />
        </div>
      </div>
    </section>
  );
}
