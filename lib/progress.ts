const DAY_MS = 86_400_000;

// Assumption: a topic counts as done if it was covered in class or self-studied.
export function isDone(s: { in_class: boolean; self_study: boolean }): boolean {
  return s.in_class || s.self_study;
}

export function percent(done: number, total: number): number {
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

function ymd(zone: string, now: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: zone }).format(now);
}

export function todayIn(tz: string | undefined, now: Date = new Date()): string {
  try {
    return ymd(tz ?? "UTC", now);
  } catch {
    return ymd("UTC", now);
  }
}

export function daysUntil(examDate: string, today: string): number {
  const ms = Date.parse(`${examDate}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`);
  return ms / DAY_MS;
}

export function countdown(
  examDate: string | null,
  today: string,
): { label: string; urgent: boolean; today: boolean } | null {
  if (!examDate) return null;
  const days = daysUntil(examDate, today);
  if (days < 0) return null;
  const label = days === 0 ? "exam today" : days === 1 ? "exam in 1 day" : `exam in ${days} days`;
  return { label, urgent: days <= 7, today: days === 0 };
}

export function sortSubjects<T extends { exam_date: string | null; created_at: Date }>(
  list: T[],
  today: string,
): T[] {
  const isUpcoming = (s: T) => s.exam_date !== null && daysUntil(s.exam_date, today) >= 0;
  const upcoming = list
    .filter(isUpcoming)
    .sort((a, b) => daysUntil(a.exam_date!, today) - daysUntil(b.exam_date!, today));
  const rest = list
    .filter((s) => !isUpcoming(s))
    .sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
  return [...upcoming, ...rest];
}
