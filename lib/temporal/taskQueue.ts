/** Task queue for app workers; override with TEMPORAL_TASK_QUEUE. */
export function temporalTaskQueue(): string {
  return process.env.TEMPORAL_TASK_QUEUE?.trim() || "harmonic-curator";
}
