import Link from "next/link";
import styles from "@/styles/auth.module.css";
import { requestPasswordReset } from "../login/actions";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <main className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>Forgot your password?</h1>
        <p className={styles.sub}>We&apos;ll email you a reset link</p>

        {error && <div className={styles.error}>{error}</div>}
        {message && <div className={styles.message}>{message}</div>}

        <form action={requestPasswordReset} className={styles.form}>
          <label className={styles.label}>
            Email
            <input className={styles.input} name="email" type="email" required autoComplete="email" />
          </label>
          <button className={styles.primary}>Send reset link</button>
        </form>

        <p className={styles.switch}>
          <Link href="/login">Back to log in</Link>
        </p>
      </div>
    </main>
  );
}