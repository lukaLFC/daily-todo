"use server";

import { revalidatePath } from "next/cache";
import { logicalToday } from "@/lib/dates";
import { getUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

const text = (formData: FormData, name: string) => String(formData.get(name) ?? "").trim();

// both pages show the same tasks, so refresh both
const refresh = () => {
  revalidatePath("/");
  revalidatePath("/lists");
};

const NO_TIMER = { timer_started_at: null, timer_elapsed_ms: 0, timer_fired: false };

export async function createList(formData: FormData) {
  const name = text(formData, "name");
  if (!name) return;

  const supabase = await createClient();
  const { data: last } = await supabase
    .from("lists").select("position").order("position", { ascending: false }).limit(1);
  const position = (last?.[0]?.position ?? -1) + 1;

  // owner_id is filled in by the database (default auth.uid())
  const { error } = await supabase.from("lists").insert({ name, position });
  if (error) throw new Error(error.message);
  refresh();
}

export async function deleteList(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("lists").delete().eq("id", text(formData, "listId"));
  if (error) throw new Error(error.message);
  refresh();
}

export async function moveList(formData: FormData) {
  const id = text(formData, "listId");
  const direction = Number(formData.get("direction")); // -1 = up, 1 = down

  const supabase = await createClient();
  const { data: lists, error } = await supabase
    .from("lists").select("id, position").order("position").order("created_at");
  if (error || !lists) throw new Error(error?.message ?? "Could not load lists");

  const from = lists.findIndex((l) => l.id === id);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= lists.length) return;

  [lists[from], lists[to]] = [lists[to], lists[from]];
  // renumber 0, 1, 2 ... and save only what changed
  await Promise.all(
    lists.map((l, i) =>
      l.position === i ? null : supabase.from("lists").update({ position: i }).eq("id", l.id),
    ),
  );
  refresh();
}

export async function addTask(formData: FormData) {
  const name = text(formData, "name");
  if (!name) return;
  const frequency = Math.max(0, parseInt(text(formData, "frequency")) || 0);

  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .insert({ list_id: text(formData, "listId"), name, frequency_days: frequency });
  if (error) throw new Error(error.message);
  refresh();
}

export async function toggleDone(formData: FormData) {
  const id = text(formData, "taskId");
  const supabase = await createClient();
  const user = await getUser();

  // the task and the profile don't depend on each other: ask for both at once
  const [{ data: task }, { data: profile }] = await Promise.all([
    supabase.from("tasks").select("*").eq("id", id).single(),
    supabase.from("profiles").select("timezone, day_ends").eq("id", user.id).single(),
  ]);
  if (!task) return;

  if (!task.is_done) {
    // checking: remember the old date so un-checking can restore it
    const today = logicalToday(profile?.timezone ?? "UTC", profile?.day_ends ?? "05:00");
    await supabase
      .from("tasks")
      .update({ is_done: true, prev_done: task.last_done, last_done: today, done_by: user.id })
      .eq("id", id);
  } else {
    await supabase
      .from("tasks")
      .update({ is_done: false, last_done: task.prev_done, prev_done: null })
      .eq("id", id);
  }
  refresh();
}

export async function toggleSelected(formData: FormData) {
  const id = text(formData, "taskId");
  const supabase = await createClient();
  const { data: task } = await supabase.from("tasks").select("is_selected").eq("id", id).single();
  if (!task) return;
  await supabase
    .from("tasks")
    .update({ is_selected: !task.is_selected, ...(task.is_selected ? NO_TIMER : {}) })
    .eq("id", id);
  refresh();
}

export async function updateTimezone(timezone: string) {
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: timezone }); // throws if it isn't a real time zone
  } catch {
    return;
  }
  const supabase = await createClient();
  const user = await getUser();
  await supabase.from("profiles").update({ timezone }).eq("id", user.id);
  refresh();
}

export async function updateTask(formData: FormData) {
  const name = text(formData, "name");
  if (!name) return;
  const frequency = Math.max(0, Math.floor(Number(text(formData, "frequency")) || 0));
  // checkbox off = no timer; on = the minutes box (default 30)
  const timerOn = formData.get("timerOn") === "on";
  const minutes = Math.floor(Number(text(formData, "timer")) || 0);
  const timer = timerOn ? Math.min(1440, Math.max(1, minutes || 30)) : 0;
  const lastDone = text(formData, "lastDone") || null; // "YYYY-MM-DD" or empty

  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({
      name,
      frequency_days: frequency,
      timer_minutes: timer,
      last_done: lastDone,
      ...(timer === 0 ? NO_TIMER : {}),
    })
    .eq("id", text(formData, "taskId"));
  if (error) throw new Error(error.message);
  refresh();
}

export async function deleteTask(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", text(formData, "taskId"));
  if (error) throw new Error(error.message);
  refresh();
}

export async function setListColor(formData: FormData) {
  const raw = text(formData, "hue");
  const hue = raw === "" ? null : Number(raw); // empty = no colour
  const supabase = await createClient();
  const { error } = await supabase.from("lists").update({ hue }).eq("id", text(formData, "listId"));
  if (error) throw new Error(error.message);
  refresh();
}

// ---------- stopwatch ----------
export async function timerStart(taskId: string) {
  const supabase = await createClient();
  await supabase
    .from("tasks")
    .update({ timer_started_at: new Date().toISOString() })
    .eq("id", taskId)
    .is("timer_started_at", null); // already running: do nothing
  refresh();
}

export async function timerPause(taskId: string) {
  const supabase = await createClient();
  const { data: t } = await supabase
    .from("tasks").select("timer_started_at, timer_elapsed_ms").eq("id", taskId).single();
  if (!t?.timer_started_at) return;
  const elapsed = Number(t.timer_elapsed_ms) + (Date.now() - Date.parse(t.timer_started_at));
  await supabase
    .from("tasks")
    .update({ timer_started_at: null, timer_elapsed_ms: Math.round(elapsed) })
    .eq("id", taskId);
  refresh();
}

export async function timerReset(taskId: string) {
  const supabase = await createClient();
  await supabase.from("tasks").update(NO_TIMER).eq("id", taskId);
  refresh();
}

// The stopwatch reached the task's time: mark it done (the stopwatch keeps running).
// The server re-checks the time itself, so the browser can't cheat.
export async function completeByTimer(taskId: string) {
  const supabase = await createClient();
  const user = await getUser();
  const [{ data: task }, { data: profile }] = await Promise.all([
    supabase.from("tasks").select("*").eq("id", taskId).single(),
    supabase.from("profiles").select("timezone, day_ends").eq("id", user.id).single(),
  ]);
  if (!task || task.timer_fired || task.timer_minutes <= 0) return;

  const elapsed =
    Number(task.timer_elapsed_ms) +
    (task.timer_started_at ? Date.now() - Date.parse(task.timer_started_at) : 0);
  if (elapsed < task.timer_minutes * 60000 - 2000) return; // 2 s tolerance

  const changes: Record<string, unknown> = { timer_fired: true };
  if (!task.is_done) {
    changes.is_done = true;
    changes.prev_done = task.last_done;
    changes.last_done = logicalToday(profile?.timezone ?? "UTC", profile?.day_ends ?? "05:00");
    changes.done_by = user.id;
  }
  await supabase.from("tasks").update(changes).eq("id", taskId);
  refresh();
}

// move the stopwatch by some minutes (negative = go back), e.g. after forgetting to stop it
export async function timerAdjust(taskId: string, deltaMinutes: number) {
  const delta = Math.max(-1440, Math.min(1440, deltaMinutes));
  const supabase = await createClient();
  const { data: t } = await supabase
    .from("tasks")
    .select("timer_minutes, timer_started_at, timer_elapsed_ms, timer_fired")
    .eq("id", taskId)
    .single();
  if (!t) return;

  const now = Date.now();
  const elapsed = Number(t.timer_elapsed_ms) + (t.timer_started_at ? now - Date.parse(t.timer_started_at) : 0);
  const next = Math.max(0, Math.round(elapsed + delta * 60000));

  await supabase
    .from("tasks")
    .update({
      timer_elapsed_ms: next,
      // still running: restart the clock from now with the new total
      timer_started_at: t.timer_started_at ? new Date(now).toISOString() : null,
      // went back under the goal: it may finish again later
      timer_fired: next >= t.timer_minutes * 60000 ? t.timer_fired : false,
    })
    .eq("id", taskId);
  refresh();
}