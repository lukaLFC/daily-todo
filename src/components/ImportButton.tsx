"use client";

import { useState, type ChangeEvent } from "react";
import { importBackup } from "@/app/settings/actions";
import styles from "@/styles/app.module.css";

export default function ImportButton() {
  const [busy, setBusy] = useState(false);

  async function onPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // so picking the same file again works
    if (!file) return;
    if (!confirm("Replace ALL your lists and tasks with the contents of this file?")) return;
    setBusy(true);
    const result = await importBackup(await file.text());
    setBusy(false);
    alert(result.message);
  }

  return (
    <label className={styles.segBtn}>
      {busy ? "Importing…" : "Import"}
      <input type="file" accept=".json,application/json" hidden onChange={onPick} disabled={busy} />
    </label>
  );
}