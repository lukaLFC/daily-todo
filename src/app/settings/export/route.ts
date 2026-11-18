import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Not signed in", { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("theme, day_ends").eq("id", user.id).single();
  const { data: lists } = await supabase
    .from("lists").select("*, tasks(*)").order("position").order("created_at");

  const backup = {
    app: "daily-todo",
    version: 2,
    exportedAt: new Date().toISOString(),
    settings: { theme: profile?.theme ?? "day", dayEnds: String(profile?.day_ends ?? "05:00").slice(0, 5) },
    lists: (lists ?? []).map((l) => ({
      name: l.name,
      hue: l.hue,
      tasks: (l.tasks ?? []).map((t: Record<string, unknown>) => ({
        name: t.name,
        frequency: t.frequency_days,
        isDone: t.is_done,
        isSelected: t.is_selected,
        lastDone: t.last_done,
        prevDone: t.prev_done,
        timerMin: t.timer_minutes,
      })),
    })),
  };

  return new Response(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="daily-todo-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}