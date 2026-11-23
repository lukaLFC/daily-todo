import Link from "next/link";
import { cookies } from "next/headers";
import AutoSaveForm from "@/components/AutoSaveForm";
import ImportButton from "@/components/ImportButton";
import { signOut } from "@/app/login/actions";
import { getSupabase, getUser } from "@/lib/session";
import styles from "@/styles/app.module.css";
import { setDayEnds, updateDisplayName } from "./actions";
import { BackIcon } from "@/components/icons";
import AvatarPicker from "@/components/AvatarPicker";
import ThemeSwitch from "@/components/ThemeSwitch";

export default async function SettingsPage() {
  const supabase = await getSupabase();
  const user = await getUser();
  const { data: profile } = await supabase
    .from("profiles").select("theme, day_ends, display_name, avatar_url").eq("id", user.id).single();
  const saved = (await cookies()).get("theme")?.value;
  const theme = saved === "day" || saved === "night" ? saved : (profile?.theme ?? "day");
  const dayEnds = String(profile?.day_ends ?? "05:00").slice(0, 5); // "05:00:00" -> "05:00"

  return (
    <main className={styles.wrap}>
      <header className={styles.header}>
        <div>
          <Link href="/" className={styles.iconBtn} aria-label="Back to daily list"><BackIcon /></Link>
        </div>
        <div className={styles.title}>
          <h1>Settings</h1>
          <p className={styles.sub}>Make the app yours</p>
        </div>
        <div />
      </header>

      <section className={styles.card}>
        <div className={styles.profile}>
          <AvatarPicker
            avatarUrl={profile?.avatar_url ?? null}
            initial={(profile?.display_name || user.email || "?").charAt(0).toUpperCase()}
          />
        </div>
        <div className={styles.setting}>
          <div>
            <b>Display name</b>
            <div className={styles.meta}>Shown to people you share lists with</div>
          </div>
          <AutoSaveForm action={updateDisplayName}>
            <input className={styles.input} name="displayName" defaultValue={profile?.display_name ?? ""} maxLength={60} required />
          </AutoSaveForm>
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.setting}>
          <div>
            <b>Theme</b>
            <div className={styles.meta}>Light or dark look</div>
          </div>
          <ThemeSwitch theme={theme} />
        </div>

        <div className={styles.setting}>
          <div>
            <b>Day ends at</b>
            <div className={styles.meta}>Your daily list resets at this time. Before it, you&apos;re still on the previous day.</div>
          </div>
          <AutoSaveForm action={setDayEnds}>
            <input className={styles.input} type="time" name="dayEnds" defaultValue={dayEnds} required />
          </AutoSaveForm>
        </div>

        <div className={styles.setting}>
          <div>
            <b>Backup</b>
            <div className={styles.meta}>Export your lists and tasks to a file, or import one to replace them.</div>
          </div>
          <div className={styles.seg}>
            {/* plain <a>, not <Link>: this URL downloads a file */}
            <a href="/settings/export" className={styles.segBtn} download>Export</a>
            <ImportButton />
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.setting}>
          <div>
            <b>Account</b>
            <div className={styles.meta}>{user.email}</div>
          </div>
          <form action={signOut}>
            <button className={styles.segBtn}>Sign out</button>
          </form>
        </div>
      </section>
    </main>
  );
}