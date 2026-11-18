import Link from "next/link";
import styles from "@/styles/app.module.css";
import { EyeIcon, EyeOffIcon, GearIcon } from "./icons";

type Props = { page: "daily" | "lists"; title: string; subtitle: string };

export default function Header({ page, title, subtitle }: Props) {
  const onDaily = page === "daily";
  return (
    <header className={styles.header}>
      <div />
      <div className={styles.title}>
        <h1>{title}</h1>
        <p className={styles.sub}>{subtitle}</p>
      </div>
      <div className={styles.icons}>
        {/* the eye switches pages: crossed on the daily page, open on the lists page */}
        <Link
          href={onDaily ? "/lists" : "/"}
          className={styles.iconBtn}
          aria-label={onDaily ? "See all lists" : "Back to daily list"}
        >
          {onDaily ? <EyeOffIcon /> : <EyeIcon />}
        </Link>
                <Link href="/settings" className={styles.iconBtn} aria-label="Settings">
          <GearIcon />
        </Link>
      </div>
    </header>
  );
}