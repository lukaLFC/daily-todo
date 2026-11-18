import { addDays, diffDays } from "./dates";

export type Task = {
  id: string;
  list_id: string;
  name: string;
  frequency_days: number;
  is_done: boolean;
  is_selected: boolean;
  last_done: string | null;
  prev_done: string | null;
  done_by: string | null;
  timer_minutes: number;
  timer_started_at: string | null;
  timer_elapsed_ms: number;
  timer_fired: boolean;
  created_at: string;
};

export type List = {
  id: string;
  name: string;
  hue: number | null;
  position: number;
  tasks: Task[];
};

// The day a task is due: last done + frequency. Never done = due today.
// A finished temporary (one-time) task has no due date.
export function dueOn(task: Task, today: string): string | null {
  if (task.frequency_days === 0) return task.is_done ? null : today;
  if (!task.last_done) return today;
  return addDays(task.last_done, task.frequency_days);
}

// Longest-waiting first: overdue by 23 days sits above overdue by 2, then due today, then due soon.
export function sortTasks(tasks: Task[], today: string): Task[] {
  const key = (t: Task) => dueOn(t, today) ?? "9999-12-31";
  return [...tasks].sort(
    (a, b) => key(a).localeCompare(key(b)) || a.created_at.localeCompare(b.created_at)
  );
}

const days = (n: number) => (n === 1 ? "1 day" : `${n} days`);

export function dueLabel(task: Task, today: string): { text: string; due: boolean } {
  if (task.frequency_days === 0) return { text: "temporary", due: false };
  const n = diffDays(today, dueOn(task, today) ?? today);
  if (n < 0) return { text: `overdue by ${days(-n)}`, due: true };
  if (n === 0) return { text: "due today", due: true };
  return { text: `due in ${days(n)}`, due: false };
}

export const freqText = (n: number) =>
  n === 0 ? "one-time" : n === 1 ? "every day" : `every ${n} days`;

export const HUES = Array.from({ length: 24 }, (_, i) => i * 15);

// Daily-list order: longest overdue first. A done task is sorted as if it were
// not done yet, so ticking or unticking never makes it jump.
export function sortDaily(tasks: Task[], today: string): Task[] {
  const key = (t: Task) =>
    dueOn({ ...t, is_done: false, last_done: t.is_done ? t.prev_done : t.last_done }, today) ?? today;
  return [...tasks].sort(
    (a, b) => key(a).localeCompare(key(b)) || a.created_at.localeCompare(b.created_at),
  );
}