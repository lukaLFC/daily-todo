"use client";

import { useEffect, useState } from "react";
import { completeByTimer, timerPause, timerReset, timerStart } from "@/app/lists/actions";
import type { Task } from "@/lib/tasks";
import styles from "@/styles/app.module.css";

const pad = (n: number) => String(n).padStart(2, "0");
function clock(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`;
}

type Props = { task: Task; serverNow: number };

export default function Stopwatch({ task, serverNow }: Props) {
  const [now, setNow] = useState(serverNow);

  const goal = task.timer_minutes * 60000;
  const startedAt = task.timer_started_at ? Date.parse(task.timer_started_at) : null;
  const running = startedAt !== null;
  const elapsed = task.timer_elapsed_ms + (startedAt ? Math.max(0, now - startedAt) : 0);
  const reached = elapsed >= goal;

  // tick once a second while running, using the server's clock (not the computer's)
  useEffect(() => {
    if (!running) return;
    const offset = serverNow - Date.now();
    const id = setInterval(() => setNow(Date.now() + offset), 1000);
    return () => clearInterval(id);
  }, [running, serverNow]);

  // time is up: ask the server to mark the task done (once)
  useEffect(() => {
    if (reached && !task.timer_fired) completeByTimer(task.id);
  }, [reached, task.timer_fired, task.id]);

  return (
    <div>
      <div className={styles.tbar}>
        <div
          className={`${styles.tbarFill} ${reached ? styles.full : ""}`}
          style={{ width: `${Math.min(100, (elapsed / goal) * 100)}%` }}
        />
      </div>
      <div className={styles.timerRow}>
        <span className={styles.meta}>
          {clock(elapsed)} / {clock(goal)}
          {elapsed > goal && ` · +${clock(elapsed - goal)}`}
        </span>
        <span>
          {!running && elapsed > 0 && (
            <button type="button" className={styles.ghost} onClick={() => timerReset(task.id)} aria-label="Reset stopwatch">↺</button>
          )}
          <button
            type="button"
            className={styles.ghost}
            onClick={() => (running ? timerPause(task.id) : timerStart(task.id))}
            aria-label={running ? "Pause" : "Start"}
          >
            {running ? "⏸" : "▶"}
          </button>
        </span>
      </div>
    </div>
  );
}