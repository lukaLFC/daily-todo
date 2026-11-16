"use client";

import { useState } from "react";
import { deleteList } from "@/app/lists/actions";
import styles from "@/styles/app.module.css";
import { DotsIcon } from "./icons";

export default function ListMenu({ listId }: { listId: string }) {
  const [open, setOpen] = useState(false); // remembered value + a function to change it

  return (
    <div className={styles.menu}>
      <button type="button" className={styles.ghost} onClick={() => setOpen(!open)} aria-label="List options">
        <DotsIcon />
      </button>

      {open && <div className={styles.backdrop} onClick={() => setOpen(false)} />}

      {open && (
        <div className={styles.menuPop}>
          <form
            action={deleteList}
            onSubmit={(e) => {
              if (!confirm("Delete this list and all its tasks?")) e.preventDefault();
            }}
          >
            <input type="hidden" name="listId" value={listId} />
            <button className={styles.danger}>Delete list</button>
          </form>
        </div>
      )}
    </div>
  );
}