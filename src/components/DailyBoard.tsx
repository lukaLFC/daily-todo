"use client";

import { useOptimistic, useTransition, type CSSProperties } from "react";
import { toggleDone, toggleSelected } from "@/app/lists/actions";
import { dueLabel, freqText, type List, type Task } from "@/lib/tasks";
import styles from "@/styles/app.module.css";
import Stopwatch from "./Stopwatch";

type Action = { type: "toggle" | "remove"; id: string };

type Props = { lists: List[]; today: string; serverNow: number };

export default function DailyBoard({ lists, today, serverNow }: Props) {
  const [, startTransition] = useTransition();

  // the "what the screen shows right now" copy of the lists, changed instantly by apply()
  const [shown, apply] = useOptimistic(lists, (current: List[], action: Action) =>
    current
      .map((l) => ({
        ...l,
        tasks:
          action.type === "remove"
            ? l.tasks.filter((t) => t.id !== action.id)
            : l.tasks.map((t) => (t.id === action.id ? { ...t, is_done: !t.is_done } : t)),
      }))
      .filter((l) => l.tasks.length > 0),
  );

  // 1) change the screen now  2) tell the server in the background
  function run(action: Action, serverCall: (formData: FormData) => Promise<void>) {
    startTransition(async () => {
      apply(action);
      const formData = new FormData();
      formData.set("taskId", action.id);
      await serverCall(formData);
    });
  }

  const all = shown.flatMap((l) => l.tasks);
  const doneCount = all.filter((t) => t.is_done).length;

  return (
    <>
      {all.length > 0 && (
        <div className={styles.progress}>
          <div className={styles.progressLabel}>{doneCount} of {all.length} done</div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${(doneCount / all.length) * 100}%` }} />
          </div>
        </div>
      )}

      {shown.length === 0 && (
        <p className={styles.empty}>
          Nothing here yet. Open My lists (the eye icon) and star the tasks you want today.
        </p>
      )}

      {shown.map((list) => {
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
              <Row
                key={task.id}
                task={task}
                today={today}
                serverNow={serverNow}
                onToggle={() => run({ type: "toggle", id: task.id }, toggleDone)}
                onRemove={() => run({ type: "remove", id: task.id }, toggleSelected)}
              />
            ))}
          </section>
        );
      })}
    </>
  );
}

type RowProps = {
  task: Task;
  today: string;
  serverNow: number;
  onToggle: () => void;
  onRemove: () => void;
};

function Row({ task, today, serverNow, onToggle, onRemove }: RowProps) {
  const label = task.is_done ? { text: "done", due: false } : dueLabel(task, today);

  // name, badge and "every day": shown the same with or without a timer
  const info = (
    <>
      <b>{task.name}</b>
      <span className={`${styles.badge} ${label.due ? styles.badgeDue : ""}`}>{label.text}</span>
      <div className={styles.meta}>{freqText(task.frequency_days)}</div>
    </>
  );

  return (
    <div className={`${styles.task} ${task.is_done ? styles.done : ""}`}>
      <button
        type="button"
        className={`${styles.check} ${task.is_done ? styles.checked : ""}`}
        onClick={onToggle}
        aria-label={task.is_done ? "Mark as not done" : "Mark as done"}
      >
        {task.is_done ? "✓" : ""}
      </button>

      {task.timer_minutes > 0 ? (
        <Stopwatch task={task} serverNow={serverNow}>
          {info}
        </Stopwatch>
      ) : (
        <div className={styles.name}>{info}</div>
      )}

      {/* removes it from the daily list (un-stars it); it stays in My lists */}
      <button type="button" className={styles.ghost} onClick={onRemove} aria-label="Remove from daily list">
        ✕
      </button>
    </div>
  );
}