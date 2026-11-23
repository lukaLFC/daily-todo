"use client";

import { useEffect, useMemo, useOptimistic, useState, useTransition, type ReactNode } from "react";
import { completeByTimer, timerAdjust, timerPause, timerReset, timerStart } from "@/app/lists/actions";
import type { Task } from "@/lib/tasks";
import styles from "@/styles/app.module.css";

const pad = (n: number) => String(n).padStart(2, "0");
function clock(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`;
}

const svg = { width: 17, height: 17, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const PlayIcon = () => <svg {...svg} fill="currentColor"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z" /></svg>;
const PauseIcon = () => <svg {...svg} fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>;
const ResetIcon = () => <svg {...svg}><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 3v5h5" /></svg>;
const EditIcon = () => <svg {...svg} width={16} height={16}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>;

const STEPS = [-10, -5, -1, 1, 5, 10];

// the stopwatch as two numbers: when it was last started (null = paused) and the time counted before that
type Clock = { startedAt: number | null; baseMs: number };
type TimerAction = { at: number } & (
  | { type: "start" }
  | { type: "pause" }
  | { type: "reset" }
  | { type: "adjust"; minutes: number }
);

const elapsedOf = (c: Clock, now: number) =>
  c.baseMs + (c.startedAt !== null ? Math.max(0, now - c.startedAt) : 0);

// the same rules the server uses, applied to the copy on screen
function reduce(c: Clock, a: TimerAction): Clock {
  switch (a.type) {
    case "start":
      return c.startedAt !== null ? c : { ...c, startedAt: a.at };
    case "pause":
      return c.startedAt === null ? c : { startedAt: null, baseMs: elapsedOf(c, a.at) };
    case "reset":
      return { startedAt: null, baseMs: 0 };
    case "adjust":
      return {
        startedAt: c.startedAt !== null ? a.at : null,
        baseMs: Math.max(0, elapsedOf(c, a.at) + a.minutes * 60000),
      };
  }
}

type Props = { task: Task; serverNow: number; children: ReactNode };

export default function Stopwatch({ task, serverNow, children }: Props) {
  const [now, setNow] = useState(serverNow);
  const [offset] = useState(() => serverNow - Date.now()); // server clock minus this computer's clock
  const [adjusting, setAdjusting] = useState(false);
  const [, startTransition] = useTransition();

  // what the database says
  const real = useMemo<Clock>(
    () => ({ startedAt: task.timer_started_at ? Date.parse(task.timer_started_at) : null, baseMs: task.timer_elapsed_ms }),
    [task.timer_started_at, task.timer_elapsed_ms],
  );
  // what the screen shows right now (changed instantly by apply())
  const [shown, apply] = useOptimistic(real, reduce);

  const goal = task.timer_minutes * 60000;
  const running = shown.startedAt !== null;
  const elapsed = elapsedOf(shown, now);
  const reached = elapsed >= goal;
  const realReached = elapsedOf(real, now) >= goal;

  // tick once a second while running, using the server's clock (not the computer's)
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now() + offset), 1000);
    return () => clearInterval(id);
  }, [running, offset]);

  // time is up (according to the database): ask the server to mark the task done, once
  useEffect(() => {
    if (realReached && !task.timer_fired) completeByTimer(task.id);
  }, [realReached, task.timer_fired, task.id]);

  // 1) change the screen now  2) tell the server in the background
  function act(action: { type: "start" | "pause" | "reset" } | { type: "adjust"; minutes: number }, serverCall: () => Promise<void>) {
    const at = Date.now() + offset;
    setNow(at);
    startTransition(async () => {
      apply({ ...action, at });
      await serverCall();
    });
  }

  return (
    <>
      <div className={styles.name}>
        {children /* name, badge, "every day" from the page */}

        <div className={styles.tbar}>
          <div
            className={`${styles.tbarFill} ${reached ? styles.full : ""}`}
            style={{ width: `${Math.min(100, (elapsed / goal) * 100)}%` }}
          />
        </div>

        <div className={`${styles.meta} ${styles.stopwatchTime}`}>
          <span>
            {clock(elapsed)} / {clock(goal)}
            {elapsed > goal && ` · +${clock(elapsed - goal)}`}
          </span>
          <button
            type="button"
            className={styles.ghost}
            onClick={() => setAdjusting(!adjusting)}
            aria-label="Adjust the time"
            aria-expanded={adjusting}
          >
            <EditIcon />
          </button>
        </div>

        {adjusting && (
          <div className={styles.adjust}>
            {STEPS.map((m) => (
              <button
                key={m}
                type="button"
                className={styles.chip}
                onClick={() => act({ type: "adjust", minutes: m }, () => timerAdjust(task.id, m))}
              >
                {m > 0 ? `+${m}` : m} min
              </button>
            ))}
          </div>
        )}
      </div>

      {/* sits between the name and the ✕, centred vertically in the row */}
      <div className={styles.timerBtns}>
        {!running && elapsed > 0 && (
          <button
            type="button"
            className={styles.timerBtn}
            onClick={() => act({ type: "reset" }, () => timerReset(task.id))}
            aria-label="Reset stopwatch"
          >
            <ResetIcon />
          </button>
        )}
        <button
          type="button"
          className={styles.timerBtn}
          onClick={() =>
            running
              ? act({ type: "pause" }, () => timerPause(task.id))
              : act({ type: "start" }, () => timerStart(task.id))
          }
          aria-label={running ? "Pause" : "Start"}
        >
          {running ? <PauseIcon /> : <PlayIcon />}
        </button>
      </div>
    </>
  );
}