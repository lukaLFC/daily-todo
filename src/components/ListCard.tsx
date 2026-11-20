"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { addTask } from "@/app/lists/actions";
import { shortDate } from "@/lib/dates";
import { HUES, dueLabel, freqText, sortTasks, type List, type Task } from "@/lib/tasks";
import styles from "@/styles/app.module.css";
import ListMenu from "./ListMenu";
import ManageTaskForm from "./ManageTaskForm";

type Props = {
  list: List;
  today: string;
  isFirst: boolean;
  isLast: boolean;
  managing: boolean;
  onToggleDone: (taskId: string) => void;
  onToggleStar: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onMove: (direction: 1 | -1) => void;
  onColor: (hue: number | null) => void;
};

export default function ListCard({
  list, today, isFirst, isLast, managing,
  onToggleDone, onToggleStar, onDeleteTask, onMove, onColor,
}: Props) {
  const tinted = list.hue !== null;
  const tasks = sortTasks(list.tasks, today);

  return (
    <section
      className={`${styles.card} ${tinted ? styles.tinted : ""}`}
      style={tinted ? ({ "--hue": list.hue } as CSSProperties) : undefined}
    >
      <div className={styles.cardHead}>
        <div className={styles.moveBtns}>
          <button type="button" className={styles.ghost} disabled={isFirst} onClick={() => onMove(-1)} aria-label="Move up">▲</button>
          <button type="button" className={styles.ghost} disabled={isLast} onClick={() => onMove(1)} aria-label="Move down">▼</button>
        </div>
        <h2>{list.name}</h2>
        {managing ? (
          <Link href="/lists" className={styles.saveLink} aria-label="Done managing">✓</Link>
        ) : (
          <ListMenu listId={list.id} />
        )}
      </div>

      {managing && <ColorPicker current={list.hue} onColor={onColor} />}

      {tasks.length === 0 && <p className={styles.meta}>No tasks yet.</p>}
      {tasks.map((task) =>
        managing ? (
          <ManageRow key={task.id} task={task} today={today} onDelete={() => onDeleteTask(task.id)} />
        ) : (
          <TaskRow
            key={task.id}
            task={task}
            today={today}
            onToggleDone={() => onToggleDone(task.id)}
            onToggleStar={() => onToggleStar(task.id)}
          />
        ),
      )}

      {managing && (
        <>
          <form action={addTask} className={styles.addForm} style={{ marginTop: 10 }}>
            <input type="hidden" name="listId" value={list.id} />
            <input className={styles.input} name="name" placeholder="New task" required />
            <input className={styles.numInput} name="frequency" type="number" min="0" defaultValue="0" title="Repeat every N days (0 = one-time)" />
            <button className={styles.primary}>Add</button>
          </form>
          <p className={styles.hint}>Repeat every N days. Use 0 for a one-time task.</p>
        </>
      )}
    </section>
  );
}

function ColorPicker({ current, onColor }: { current: number | null; onColor: (hue: number | null) => void }) {
  return (
    <>
      <div className={styles.colorLabel}>List colour</div>
      <div className={styles.swatches}>
        <button
          type="button"
          className={`${styles.swatch} ${styles.swatchNone} ${current === null ? styles.swatchOn : ""}`}
          onClick={() => onColor(null)}
          aria-label="No colour"
        >
          ✕
        </button>
        {HUES.map((h) => (
          <button
            key={h}
            type="button"
            className={`${styles.swatch} ${current === h ? styles.swatchOn : ""}`}
            style={{ background: `hsl(${h} 70% 78%)` }}
            onClick={() => onColor(h)}
            aria-label={`Colour ${h}`}
          />
        ))}
      </div>
    </>
  );
}

const fmtMin = (m: number) =>
  m < 60 ? `${m} min` : m % 60 === 0 ? `${m / 60} h` : `${Math.floor(m / 60)} h ${m % 60} min`;

function ManageRow({ task, today, onDelete }: { task: Task; today: string; onDelete: () => void }) {
  const label = dueLabel(task, today);
  return (
    <div className={styles.manageRow}>
      <ManageTaskForm task={task}>
        <div className={styles.meta}>
          {freqText(task.frequency_days)}
          {task.timer_minutes > 0 && ` · ⏱ ${fmtMin(task.timer_minutes)}`}
          <span className={`${styles.badge} ${label.due ? styles.badgeDue : ""}`}>{label.text}</span>
        </div>
      </ManageTaskForm>
      <button type="button" className={styles.ghost} onClick={onDelete} aria-label="Delete task">✕</button>
    </div>
  );
}

function TaskRow({
  task, today, onToggleDone, onToggleStar,
}: { task: Task; today: string; onToggleDone: () => void; onToggleStar: () => void }) {
  const label = dueLabel(task, today);

  return (
    <div className={`${styles.task} ${task.is_done ? styles.done : ""}`}>
      <button
        type="button"
        className={`${styles.check} ${task.is_done ? styles.checked : ""}`}
        onClick={onToggleDone}
        aria-label={task.is_done ? "Mark as not done" : "Mark as done"}
      >
        {task.is_done ? "✓" : ""}
      </button>

      <div className={styles.name}>
        <b>{task.name}</b>
        <span className={`${styles.badge} ${label.due ? styles.badgeDue : ""}`}>{label.text}</span>
        <div className={styles.meta}>
          {freqText(task.frequency_days)}
          {task.last_done && ` · last done ${shortDate(task.last_done)}`}
        </div>
      </div>

      <button
        type="button"
        className={`${styles.ghost} ${styles.star} ${task.is_selected ? styles.starOn : ""}`}
        onClick={onToggleStar}
        aria-label="Show in daily list"
      >
        {task.is_selected ? "★" : "☆"}
      </button>
    </div>
  );
}