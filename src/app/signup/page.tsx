import Link from "next/link";
import GoogleButton from "@/components/GoogleButton";
import styles from "@/styles/auth.module.css";
import { signup } from "../login/actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>Create your account</h1>
        <p className={styles.sub}>It only takes a minute</p>

        {error && <div className={styles.error}>{error}</div>}

        <form action={signup} className={styles.form}>
          <label className={styles.label}>
            Name
            <input className={styles.input} name="name" type="text" required autoComplete="name" />
          </label>
          <label className={styles.label}>
            Email
            <input className={styles.input} name="email" type="email" required autoComplete="email" />
          </label>
          <label className={styles.label}>
            Password (at least 6 characters)
            <input className={styles.input} name="password" type="password" required minLength={6} autoComplete="new-password" />
          </label>
          <button className={styles.primary}>Sign up</button>
        </form>

        <div className={styles.divider}>or</div>
        <GoogleButton />

        <p className={styles.switch}>
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      </div>
    </main>
  );
}