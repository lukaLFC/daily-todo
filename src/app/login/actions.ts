"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const field = (formData: FormData, name: string) => String(formData.get(name) ?? "").trim();

export async function login(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: field(formData, "email"),
    password: String(formData.get("password") ?? ""),
  });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect("/");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const { data, error } = await supabase.auth.signUp({
    email: field(formData, "email"),
    password: String(formData.get("password") ?? ""),
    options: {
      data: { display_name: field(formData, "name") },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });
  if (error) redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  // With "Confirm email" switched on, there is no session until the link in the email is clicked
  if (!data.session) {
    redirect(`/login?message=${encodeURIComponent("Check your email to confirm your account, then log in.")}`);
  }
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}