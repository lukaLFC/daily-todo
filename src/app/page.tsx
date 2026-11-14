import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { error } = await supabase.auth.getSession();

  return (
    <main style={{ padding: 24 }}>
      <h1>Daily To-Do</h1>
      <p>{error ? `Supabase error: ${error.message}` : "Connected to Supabase ✅"}</p>
    </main>
  );
}