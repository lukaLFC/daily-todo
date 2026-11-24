import Link from "next/link";
import styles from "@/styles/app.module.css";
import { DailyIcon, GearIcon, ListsIcon } from "./icons";

type Props = { page: "daily" | "lists"; title: string; subtitle: string };

export default function Header({ page, title, subtitle }: Props) {
  return (
    <header className={styles.header}>
      <div />
      <div className={styles.title}>
        <h1>{title}</h1>
        <p className={styles.sub}>{subtitle}</p>
      </div>
      <nav className={styles.icons} aria-label="Pages">
        <Link
          href="/"
          className={`${styles.iconBtn} ${page === "daily" ? styles.iconActive : ""}`}
          aria-label="Daily list"
          aria-current={page === "daily" ? "page" : undefined}
        >
          <DailyIcon />
        </Link>
        <Link
          href="/lists"
          className={`${styles.iconBtn} ${page === "lists" ? styles.iconActive : ""}`}
          aria-label="My lists"
          aria-current={page === "lists" ? "page" : undefined}
        >
          <ListsIcon />
        </Link>
        <Link href="/settings" className={styles.iconBtn} aria-label="Settings">
          <GearIcon />
        </Link>
      </nav>
    </header>
  );
}