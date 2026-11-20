import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// cache(): inside one page load, calling these many times runs them only once
export const getSupabase = cache(async () => createClient());

export const getUser = cache(async () => {
  const supabase = await getSupabase();
  const { data } = await supabase.auth.getClaims(); // checks the login token locally, no network call
  const id = data?.claims?.sub;
  if (!id) redirect("/login");
  return { id, email: data?.claims?.email as string | undefined };
});