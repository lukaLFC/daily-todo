import Link from "next/link";
import GoogleButton from "@/components/GoogleButton";
import styles from "@/styles/auth.module.css";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <main className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>Daily To-Do</h1>
        <p className={styles.sub}>Log in to your account</p>

        {error && <div className={styles.error}>{error}</div>}
        {message && <div className={styles.message}>{message}</div>}

        <form action={login} className={styles.form}>
          <label className={styles.label}>
            Email
            <input className={styles.input} name="email" type="email" required autoComplete="email" />
          </label>
          <label className={styles.label}>
            Password
            <input className={styles.input} name="password" type="password" required autoComplete="current-password" />
          </label>
          <button className={styles.primary}>Log in</button>
        </form>

        <div className={styles.divider}>or</div>
        <GoogleButton />

        <p className={styles.switch}>
          No account yet? <Link href="/signup">Sign up</Link>
        </p>
      </div>
    </main>
  );
}