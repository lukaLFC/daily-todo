// "Today" ends at the user's "day ends" time (default 05:00), in the user's own time zone.
export function logicalToday(timeZone: string, dayEnds: string): string {
  const [h = 0, m = 0] = dayEnds.split(":").map(Number);
  const shifted = new Date(Date.now() - (h * 60 + m) * 60_000);
  try {
    // the "en-CA" format happens to print YYYY-MM-DD
    return new Intl.DateTimeFormat("en-CA", {
      timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    }).format(shifted);
  } catch {
    return shifted.toISOString().slice(0, 10); // unknown time zone: fall back to UTC
  }
}

export function addDays(date: string, n: number): string {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function diffDays(from: string, to: string): number {
  return Math.round((Date.parse(to + "T00:00:00Z") - Date.parse(from + "T00:00:00Z")) / 86_400_000);
}

export function shortDate(date: string): string {
  return new Date(date + "T00:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric", month: "short", timeZone: "UTC",
  });
}