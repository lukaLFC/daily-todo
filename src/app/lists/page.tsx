import { redirect } from "next/navigation";
import Header from "@/components/Header";
import ListCard from "@/components/ListCard";
import TimezoneSync from "@/components/TimezoneSync";
import { logicalToday } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
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

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("timezone, day_ends").eq("id", user.id).single();
  const timezone = profile?.timezone ?? "UTC";
  const today = logicalToday(timezone, profile?.day_ends ?? "05:00");

  // every list, with its tasks nested inside (Supabase follows the list_id link)
  const { data } = await supabase
    .from("lists").select("*, tasks(*)").order("position").order("created_at");
  const lists = (data ?? []) as List[];

  return (
    <main className={styles.wrap}>
      <TimezoneSync current={timezone} />
      <Header page="lists" title="My lists" subtitle="Add tasks and decide what repeats" />

      {lists.length === 0 && <p className={styles.empty}>No lists yet. Create your first one below.</p>}
      {lists.map((list, i) => (
        <ListCard
          key={list.id}
          list={list}
          today={today}
          isFirst={i === 0}
          isLast={i === lists.length - 1}
          managing={manage === list.id}
        />
      ))}

      <form action={createList} className={`${styles.card} ${styles.addForm}`}>
        <input className={styles.input} name="name" placeholder="New list (e.g. Chores)" required />
        <button className={styles.primary}>Create list</button>
      </form>
    </main>
  );
}