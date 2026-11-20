"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const text = (formData: FormData, name: string) => String(formData.get(name) ?? "").trim();
const refreshAll = () => revalidatePath("/", "layout");

export async function setTheme(formData: FormData) {
  const theme = text(formData, "theme") === "night" ? "night" : "day";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("profiles").update({ theme }).eq("id", user.id);
  (await cookies()).set("theme", theme, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  refreshAll();
}

export async function setDayEnds(formData: FormData) {
  const value = text(formData, "dayEnds");
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("profiles").update({ day_ends: value }).eq("id", user.id);
  refreshAll();
}

// ---------- import: never trust a file, rebuild every field ----------
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const cleanName = (v: unknown) => String(v ?? "").trim().slice(0, 200) || "Untitled";
const cleanDate = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

export async function importBackup(json: string): Promise<{ ok: boolean; message: string }> {
  if (json.length > 5_000_000) return { ok: false, message: "That file is too big." };
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return { ok: false, message: "That file isn't valid JSON." };
  }
  if (!isObj(data) || !Array.isArray(data.lists)) {
    return { ok: false, message: "This doesn't look like a backup from this app." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You are signed out." };

  const listRows: { id: string; name: string; hue: number | null; position: number }[] = [];
  const taskRows: Record<string, unknown>[] = [];

  data.lists.filter(isObj).slice(0, 200).forEach((l, position) => {
    const id = crypto.randomUUID();
    const hue = typeof l.hue === "number" && Number.isFinite(l.hue) ? ((Math.round(l.hue) % 360) + 360) % 360 : null;
    listRows.push({ id, name: cleanName(l.name), hue, position });

    for (const t of (Array.isArray(l.tasks) ? l.tasks : []).filter(isObj)) {
      taskRows.push({
        list_id: id,
        name: cleanName(t.name),
        frequency_days: Math.max(0, parseInt(String(t.frequency)) || 0),
        is_done: !!t.isDone,
        is_selected: !!t.isSelected,
        last_done: cleanDate(t.lastDone),
        prev_done: cleanDate(t.prevDone),
        timer_minutes: Math.min(1440, Math.max(0, parseInt(String(t.timerMin)) || 0)),
      });
    }
  });
  if (taskRows.length > 5000) return { ok: false, message: "Too many tasks (the limit is 5000)." };

  // 1. add the new lists first, so a failure never leaves you with nothing
  const newIds = listRows.map((l) => l.id);
  if (listRows.length > 0) {
    const { error } = await supabase.from("lists").insert(listRows);
    if (error) return { ok: false, message: `Import failed: ${error.message}` };
  }
  if (taskRows.length > 0) {
    const { error } = await supabase.from("tasks").insert(taskRows);
    if (error) {
      if (newIds.length > 0) await supabase.from("lists").delete().in("id", newIds);
      return { ok: false, message: `Import failed: ${error.message}` };
    }
  }

  // 2. only now remove the old lists (their tasks go with them)
  let del = supabase.from("lists").delete().eq("owner_id", user.id);
  if (newIds.length > 0) del = del.not("id", "in", `(${newIds.join(",")})`);
  await del;

  // 3. settings, if the file has them
  const st = isObj(data.settings) ? data.settings : {};
  const profileChanges: Record<string, string> = {};
  if (st.theme === "day" || st.theme === "night") profileChanges.theme = st.theme;
  if (typeof st.dayEnds === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(st.dayEnds)) profileChanges.day_ends = st.dayEnds;
  if (Object.keys(profileChanges).length > 0) {
    await supabase.from("profiles").update(profileChanges).eq("id", user.id);
    if (profileChanges.theme) {
      (await cookies()).set("theme", profileChanges.theme, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    }
  }

  refreshAll();
  return { ok: true, message: `Import finished: ${listRows.length} list(s), ${taskRows.length} task(s).` };
}

export async function updateDisplayName(formData: FormData) {
  const name = text(formData, "displayName").slice(0, 60);
  if (!name) return;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("profiles").update({ display_name: name }).eq("id", user.id);
  refreshAll();
}

// the browser already shrank the photo to a small square JPEG
export async function uploadAvatar(formData: FormData): Promise<{ ok: boolean; message: string }> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "No file received." };
  if (file.type !== "image/jpeg" || file.size > 1_000_000) return { ok: false, message: "The photo must be a JPEG under 1 MB." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You are signed out." };

  const path = `${user.id}/avatar.jpg`; // one photo per user, replaced each time
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: "image/jpeg" });
  if (error) return { ok: false, message: `Upload failed: ${error.message}` };

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  // ?v=... makes browsers fetch the new picture instead of showing the cached one
  await supabase.from("profiles").update({ avatar_url: `${data.publicUrl}?v=${Date.now()}` }).eq("id", user.id);
  refreshAll();
  return { ok: true, message: "Photo updated." };
}

export async function removeAvatar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.storage.from("avatars").remove([`${user.id}/avatar.jpg`]);
  await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
  refreshAll();
}