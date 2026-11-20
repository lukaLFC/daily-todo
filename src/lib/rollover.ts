import { diffDays } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// A new day starts by itself:
//  - finished one-time tasks are deleted
//  - repeating done tasks whose time has come again become unticked
//  - every stopwatch starts the day at zero
export async function startNewDayIfNeeded(
  supabase: Supabase,
  userId: string,
  dailyDate: string | null,
  today: string,
): Promise<boolean>  {
  if (dailyDate && dailyDate >= today) return false; // same day: nothing to do

  await supabase.from("tasks").delete().eq("frequency_days", 0).eq("is_done", true);

  const { data: done } = await supabase
    .from("tasks").select("id, frequency_days, last_done").eq("is_done", true);
  const dueAgain = (done ?? [])
    .filter((t) => !t.last_done || diffDays(t.last_done, today) >= t.frequency_days)
    .map((t) => t.id);
  if (dueAgain.length > 0) {
    await supabase.from("tasks").update({ is_done: false, prev_done: null }).in("id", dueAgain);
  }

  await supabase
    .from("tasks")
    .update({ timer_started_at: null, timer_elapsed_ms: 0, timer_fired: false })
    .or("timer_started_at.not.is.null,timer_elapsed_ms.gt.0,timer_fired.eq.true");

  await supabase.from("profiles").update({ daily_date: today }).eq("id", userId);
  return true;
}