// Pure date / streak helpers shared by the client UI. All dates are handled
// as local-timezone `YYYY-MM-DD` keys to avoid UTC drift.

export function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return toKey(new Date());
}

export function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Consecutive checked days ending today (or yesterday if today is still open). */
export function currentStreak(days: Set<string>): number {
  let cur = new Date();
  if (!days.has(toKey(cur))) {
    cur = addDays(cur, -1);
    if (!days.has(toKey(cur))) return 0;
  }
  let n = 0;
  while (days.has(toKey(cur))) {
    n++;
    cur = addDays(cur, -1);
  }
  return n;
}

/** Longest run of consecutive checked days ever. */
export function bestStreak(days: Set<string>): number {
  const sorted = [...days].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const k of sorted) {
    run = prev && toKey(addDays(parseKey(prev), 1)) === k ? run + 1 : 1;
    if (run > best) best = run;
    prev = k;
  }
  return best;
}

/** Check-ins so far this week (weeks start on Monday). */
export function weekCount(days: Set<string>): number {
  const now = new Date();
  const dow = (now.getDay() + 6) % 7; // 0 = Monday
  const monday = addDays(now, -dow);
  let n = 0;
  for (let i = 0; i < 7; i++) {
    const d = addDays(monday, i);
    if (d > now) break;
    if (days.has(toKey(d))) n++;
  }
  return n;
}

/** Percentage of days checked this month (up to today). */
export function monthRate(days: Set<string>): number {
  const now = new Date();
  const daysSoFar = now.getDate();
  let n = 0;
  for (let d = 1; d <= daysSoFar; d++) {
    if (days.has(toKey(new Date(now.getFullYear(), now.getMonth(), d)))) n++;
  }
  return Math.round((n / daysSoFar) * 100);
}

/**
 * A columns-first grid of the last `weeksBack` weeks, each column being the
 * Monday..Sunday date keys of that week. Includes the current (partial) week.
 */
export function buildWeeks(weeksBack: number): string[][] {
  const now = new Date();
  const dow = (now.getDay() + 6) % 7;
  const monday = addDays(now, -dow);
  const cols: string[][] = [];
  for (let w = weeksBack - 1; w >= 0; w--) {
    const start = addDays(monday, -7 * w);
    const col: string[] = [];
    for (let i = 0; i < 7; i++) col.push(toKey(addDays(start, i)));
    cols.push(col);
  }
  return cols;
}

export function isFutureKey(key: string): boolean {
  return key > todayKey();
}

export function formatDay(key: string): string {
  return parseKey(key).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function prettyToday(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
