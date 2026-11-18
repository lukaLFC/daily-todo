"use server";

import { revalidatePath } from "next/cache";
import { logicalToday } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

const text = (formData: FormData, name: string) => String(formData.get(name) ?? "").trim();

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
  revalidatePath("/lists");
}

export async function deleteList(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("lists").delete().eq("id", text(formData, "listId"));
  if (error) throw new Error(error.message);
  revalidatePath("/lists");
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
      l.position === i ? null : supabase.from("lists").update({ position: i }).eq("id", l.id)
    )
  );
  revalidatePath("/lists");
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
  revalidatePath("/lists");
}

export async function toggleDone(formData: FormData) {
  const id = text(formData, "taskId");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: task } = await supabase.from("tasks").select("*").eq("id", id).single();
  if (!user || !task) return;

  if (!task.is_done) {
    // checking: remember the old date so un-checking can restore it
    const { data: profile } = await supabase
      .from("profiles").select("timezone, day_ends").eq("id", user.id).single();
    const today = logicalToday(profile?.timezone ?? "UTC", profile?.day_ends ?? "05:00");
    await supabase.from("tasks")
      .update({ is_done: true, prev_done: task.last_done, last_done: today, done_by: user.id })
      .eq("id", id);
  } else {
    await supabase.from("tasks")
      .update({ is_done: false, last_done: task.prev_done, prev_done: null })
      .eq("id", id);
  }
  revalidatePath("/lists");
}

export async function toggleSelected(formData: FormData) {
  const id = text(formData, "taskId");
  const supabase = await createClient();
  const { data: task } = await supabase.from("tasks").select("is_selected").eq("id", id).single();
  if (!task) return;
  await supabase.from("tasks").update({ is_selected: !task.is_selected }).eq("id", id);
  revalidatePath("/lists");
}

export async function updateTimezone(timezone: string) {
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: timezone }); // throws if it isn't a real time zone
  } catch {
    return;
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("profiles").update({ timezone }).eq("id", user.id);
  revalidatePath("/lists");
}

export async function updateTask(formData: FormData) {
  const name = text(formData, "name");
  if (!name) return;
  const frequency = Math.max(0, Math.floor(Number(text(formData, "frequency")) || 0));
  const timer = Math.min(1440, Math.max(0, Math.floor(Number(text(formData, "timer")) || 0)));
  const lastDone = text(formData, "lastDone") || null; // "YYYY-MM-DD" or empty

  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ name, frequency_days: frequency, timer_minutes: timer, last_done: lastDone })
    .eq("id", text(formData, "taskId"));
  if (error) throw new Error(error.message);
  revalidatePath("/lists");
}

export async function deleteTask(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", text(formData, "taskId"));
  if (error) throw new Error(error.message);
  revalidatePath("/lists");
}

export async function setListColor(formData: FormData) {
  const raw = text(formData, "hue");
  const hue = raw === "" ? null : Number(raw); // empty = no colour
  const supabase = await createClient();
  const { error } = await supabase.from("lists").update({ hue }).eq("id", text(formData, "listId"));
  if (error) throw new Error(error.message);
  revalidatePath("/lists");
}