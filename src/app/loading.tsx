import styles from "@/styles/app.module.css";

// shown instantly while the next page is being built on the server
export default function Loading() {
  return (
    <main className={styles.wrap} aria-busy="true" aria-label="Loading">
      <div className={styles.skelHeader} />
      <div className={styles.skelCard} />
      <div className={styles.skelCard} />
    </main>
  );
}