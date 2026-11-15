import styles from "@/styles/auth.module.css";
import { updatePassword } from "../login/actions";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>Choose a new password</h1>
        <p className={styles.sub}>At least 6 characters</p>

        {error && <div className={styles.error}>{error}</div>}

        <form action={updatePassword} className={styles.form}>
          <label className={styles.label}>
            New password
            <input className={styles.input} name="password" type="password" required minLength={6} autoComplete="new-password" />
          </label>
          <button className={styles.primary}>Save password</button>
        </form>
      </div>
    </main>
  );
}