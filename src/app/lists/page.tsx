import Header from "@/components/Header";
import ListsBoard from "@/components/ListsBoard";
import TimezoneSync from "@/components/TimezoneSync";
import { logicalToday } from "@/lib/dates";
import { startNewDayIfNeeded } from "@/lib/rollover";
import { getSupabase, getUser } from "@/lib/session";
import type { List } from "@/lib/tasks";
import styles from "@/styles/app.module.css";
import { createList } from "./actions";

export default async function ListsPage({
  searchParams,
}: {
  searchParams: Promise<{ manage?: string }>;
}) {
  // the part after "?manage=" in the URL (searchParams is a Promise in Next 16)
  const { manage } = await searchParams;

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
  const lists = (data ?? []) as List[];

  return (
    <main className={styles.wrap}>
      <TimezoneSync current={timezone} />
      <Header page="lists" title="My lists" subtitle="Add tasks and decide what repeats" />

      <ListsBoard lists={lists} today={today} managingId={manage} />

      <form action={createList} className={`${styles.card} ${styles.addForm}`}>
        <input className={styles.input} name="name" placeholder="New list (e.g. Chores)" required />
        <button className={styles.primary}>Create list</button>
      </form>
    </main>
  );
}