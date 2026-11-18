"use client";

import { useState, type FocusEvent, type FormEvent, type ReactNode } from "react";
import { updateTask } from "@/app/lists/actions";
import type { Task } from "@/lib/tasks";
import styles from "@/styles/app.module.css";

export default function ManageTaskForm({ task, children }: { task: Task; children: ReactNode }) {
  // only controls whether the minutes box is visible
  const [timerOn, setTimerOn] = useState(task.timer_minutes > 0);

    // checkbox and date: save as soon as they change
  function onChange(e: FormEvent<HTMLFormElement>) {
    if (!(e.target instanceof HTMLInputElement)) return;
    const input = e.target;
    if (input.type === "checkbox") setTimerOn(input.checked);
    if (input.type === "checkbox" || input.type === "date") e.currentTarget.requestSubmit();
  }

  // text and number: save when you leave the field (Enter also saves)
  function onBlur(e: FocusEvent<HTMLFormElement>) {
    if (!(e.target instanceof HTMLInputElement)) return;
    const input = e.target;
    if (input.type === "text" || input.type === "number") e.currentTarget.requestSubmit();
  }

  return (
    <form action={updateTask} onChange={onChange} onBlur={onBlur} className={styles.manageForm}>
      <input type="hidden" name="taskId" value={task.id} />
      <input className={`${styles.input} ${styles.rename}`} type="text" name="name" defaultValue={task.name} required aria-label="Task name" />

      {children /* the "every day · ⏱ 2 h · due today" line, built on the server */}

      <label className={styles.field}>
        Last done
        <input className={styles.input} name="lastDone" type="date" defaultValue={task.last_done ?? ""} />
      </label>

      <label className={styles.field}>
        Repeat every
        <input className={styles.numInput} name="frequency" type="number" min="0" defaultValue={task.frequency_days} />
        days
      </label>

      <div className={styles.field}>
        <label className={styles.field}>
          <input type="checkbox" name="timerOn" defaultChecked={task.timer_minutes > 0} /> Timer
        </label>
        {/* always in the form (so its value is sent), just hidden while the timer is off */}
        <input
          className={`${styles.numInput} ${styles.timerMin}`}
          name="timer"
          type="number"
          min="1"
          max="1440"
          defaultValue={task.timer_minutes || 30}
          hidden={!timerOn}
        />
        {timerOn && "min"}
      </div>
    </form>
  );
}