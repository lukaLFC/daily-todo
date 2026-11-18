import { redirect } from "next/navigation";
import type { CSSProperties } from "react";
import { toggleDone, toggleSelected } from "@/app/lists/actions";
import Header from "@/components/Header";
import Stopwatch from "@/components/Stopwatch";
import TimezoneSync from "@/components/TimezoneSync";
import { longDate, logicalToday } from "@/lib/dates";
import { startNewDayIfNeeded } from "@/lib/rollover";
import { createClient } from "@/lib/supabase/server";
import { dueLabel, freqText, sortDaily, type List, type Task } from "@/lib/tasks";
import styles from "@/styles/app.module.css";

export default async function DailyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("timezone, day_ends, daily_date").eq("id", user.id).single();
  const timezone = profile?.timezone ?? "UTC";
  const today = logicalToday(timezone, profile?.day_ends ?? "05:00");

  // a new day? delete finished one-time tasks, untick due repeating ones, reset stopwatches
  await startNewDayIfNeeded(supabase, user.id, profile?.daily_date ?? null, today);
  const serverNow = Date.now(); // the stopwatch counts with the server's clock

  const { data } = await supabase
    .from("lists").select("*, tasks(*)").order("position").order("created_at");

  // keep only starred tasks, and only lists that still have some
  const lists = ((data ?? []) as List[])
    .map((l) => ({ ...l, tasks: sortDaily(l.tasks.filter((t) => t.is_selected), today) }))
    .filter((l) => l.tasks.length > 0);

  return (
    <main className={styles.wrap}>
      <TimezoneSync current={timezone} />
      <Header page="daily" title="Daily to-do" subtitle={longDate(today)} />

      {lists.length === 0 && (
        <p className={styles.empty}>
          Nothing here yet. Open My lists (the eye icon) and star the tasks you want today.
        </p>
      )}

      {lists.map((list) => {
        const tinted = list.hue !== null;
        return (
          <section
            key={list.id}
            className={`${styles.card} ${tinted ? styles.tinted : ""}`}
            style={tinted ? ({ "--hue": list.hue } as CSSProperties) : undefined}
          >
            <div className={styles.cardHead}>
              <div />
              <h2>{list.name}</h2>
              <div />
            </div>
            {list.tasks.map((task) => (
              <DailyTask key={task.id} task={task} today={today} serverNow={serverNow} />
            ))}
          </section>
        );
      })}
    </main>
  );
}

function DailyTask({ task, today, serverNow }: { task: Task; today: string; serverNow: number }) {
  const label = task.is_done ? { text: "done", due: false } : dueLabel(task, today);

  return (
    <div className={`${styles.task} ${task.is_done ? styles.done : ""}`}>
      <form action={toggleDone}>
        <input type="hidden" name="taskId" value={task.id} />
        <button
          className={`${styles.check} ${task.is_done ? styles.checked : ""}`}
          aria-label={task.is_done ? "Mark as not done" : "Mark as done"}
        >
          {task.is_done ? "✓" : ""}
        </button>
      </form>

      <div className={styles.name}>
        <b>{task.name}</b>
        <span className={`${styles.badge} ${label.due ? styles.badgeDue : ""}`}>{label.text}</span>
        <div className={styles.meta}>{freqText(task.frequency_days)}</div>
        {task.timer_minutes > 0 && <Stopwatch task={task} serverNow={serverNow} />}
      </div>

      {/* removes it from the daily list (un-stars it); it stays in My lists */}
      <form action={toggleSelected}>
        <input type="hidden" name="taskId" value={task.id} />
        <button className={styles.ghost} aria-label="Remove from daily list">✕</button>
      </form>
    </div>
  );
}