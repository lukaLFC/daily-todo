import { createClient } from "@/lib/supabase/server";
import { signOut } from "./login/actions";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  return (
    <main style={{ padding: 24 }}>
      <h1>Daily To-Do</h1>
      <p>Signed in as {data.user?.email}</p>
      <p><Link href="/lists">Go to My lists</Link></p>
      <form action={signOut}>
        <button>Sign out</button>
      </form>
    </main>
  );
}