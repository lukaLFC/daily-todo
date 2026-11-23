"use client";

import { useOptimistic, useTransition } from "react";
import { setTheme } from "@/app/settings/actions";
import styles from "@/styles/app.module.css";

type Theme = "day" | "night";

export default function ThemeSwitch({ theme }: { theme: Theme }) {
  const [, startTransition] = useTransition();
  const [shown, apply] = useOptimistic(theme, (_current: Theme, next: Theme) => next);

  function choose(next: Theme) {
    if (next === shown) return;
    startTransition(async () => {
      apply(next);
      document.documentElement.dataset.theme = next; // recolour the whole app now
      const formData = new FormData();
      formData.set("theme", next);
      await setTheme(formData);
    });
  }

  return (
    <div className={styles.seg}>
      <button type="button" className={`${styles.segBtn} ${shown === "day" ? styles.segOn : ""}`} onClick={() => choose("day")}>☀ Day</button>
      <button type="button" className={`${styles.segBtn} ${shown === "night" ? styles.segOn : ""}`} onClick={() => choose("night")}>☾ Night</button>
    </div>
  );
}