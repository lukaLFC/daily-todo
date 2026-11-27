"use client";

import { createClient } from "@/lib/supabase/client";
import styles from "@/styles/auth.module.css";

export default function GoogleButton() {
  async function signInWithGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <button type="button" className={styles.google} onClick={signInWithGoogle}>
      Continue with Google
    </button>
  );
}
