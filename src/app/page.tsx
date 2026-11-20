import Header from "@/components/Header";
import DailyBoard from "@/components/DailyBoard";
import TimezoneSync from "@/components/TimezoneSync";
import { longDate, logicalToday } from "@/lib/dates";
import { startNewDayIfNeeded } from "@/lib/rollover";
import { getSupabase, getUser } from "@/lib/session";
import { sortDaily, type List } from "@/lib/tasks";
import styles from "@/styles/app.module.css";

export default async function DailyPage() {
  const supabase = await getSupabase();
  const user = await getUser();

  // profile and lists don't depend on each other: ask for both at once
  const listsQuery = () =>
    supabase.from("lists").select("*, tasks(*)").order("position").order("created_at");
  const [{ data: profile }, first] = await Promise.all([
    supabase.from("profiles").select("timezone, day_ends, daily_date").eq("id", user.id).single(),
    listsQuery(),
  ]);
  const timezone = profile?.timezone ?? "UTC";
  const today = logicalToday(timezone, profile?.day_ends ?? "05:00");

  // a new day (rare): the cleanup changes tasks, so load the lists again afterwards
  const newDay = await startNewDayIfNeeded(supabase, user.id, profile?.daily_date ?? null, today);
  const data = newDay ? (await listsQuery()).data : first.data;
  const serverNow = Date.now(); // the stopwatch counts with the server's clock

  // keep only starred tasks, and only lists that still have some
  const lists = ((data ?? []) as List[])
    .map((l) => ({ ...l, tasks: sortDaily(l.tasks.filter((t) => t.is_selected), today) }))
    .filter((l) => l.tasks.length > 0);

  return (
    <main className={styles.wrap}>
      <TimezoneSync current={timezone} />
      <Header page="daily" title="Daily to-do" subtitle={longDate(today)} />
      <DailyBoard lists={lists} today={today} serverNow={serverNow} />
    </main>
  );
}