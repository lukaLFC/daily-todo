import type { CSSProperties } from "react";
import { addTask, moveList, toggleDone, toggleSelected } from "@/app/lists/actions";
import { shortDate } from "@/lib/dates";
import { dueLabel, freqText, sortTasks, type List, type Task } from "@/lib/tasks";
import styles from "@/styles/app.module.css";
import ListMenu from "./ListMenu";

type Props = { list: List; today: string; isFirst: boolean; isLast: boolean };

export default function ListCard({ list, today, isFirst, isLast }: Props) {
  const tinted = list.hue !== null;
  const tasks = sortTasks(list.tasks, today);

  return (
    <section
      className={`${styles.card} ${tinted ? styles.tinted : ""}`}
      style={tinted ? ({ "--hue": list.hue } as CSSProperties) : undefined}
    >
      <div className={styles.cardHead}>
        <div className={styles.moveBtns}>
          <MoveButton listId={list.id} direction={-1} disabled={isFirst} />
          <MoveButton listId={list.id} direction={1} disabled={isLast} />
        </div>
        <h2>{list.name}</h2>
        <ListMenu listId={list.id} />
      </div>

      {tasks.length === 0 && <p className={styles.meta}>No tasks yet.</p>}
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} today={today} />
      ))}

      {/* temporary: in round 2 this moves into "Manage tasks" */}
      <form action={addTask} className={styles.addForm} style={{ marginTop: 10 }}>
        <input type="hidden" name="listId" value={list.id} />
        <input className={styles.input} name="name" placeholder="New task" required />
        <input className={styles.numInput} name="frequency" type="number" min="0" defaultValue="0" title="Repeat every N days (0 = one-time)" />
        <button className={styles.primary}>Add</button>
      </form>
      <p className={styles.hint}>Repeat every N days. Use 0 for a one-time task.</p>
    </section>
  );
}

function MoveButton({ listId, direction, disabled }: { listId: string; direction: 1 | -1; disabled: boolean }) {
  return (
    <form action={moveList}>
      <input type="hidden" name="listId" value={listId} />
      <input type="hidden" name="direction" value={direction} />
      <button className={styles.ghost} disabled={disabled} aria-label={direction === -1 ? "Move up" : "Move down"}>
        {direction === -1 ? "▲" : "▼"}
      </button>
    </form>
  );
}

function TaskRow({ task, today }: { task: Task; today: string }) {
  const label = dueLabel(task, today);

  return (
    <div className={`${styles.task} ${task.is_done ? styles.done : ""}`}>
      <form action={toggleDone}>
        <input type="hidden" name="taskId" value={task.id} />
        <button
          className={`${styles.check} ${task.is_done ? styles.checked : ""}`}
          aria-label={task.is_done ? "Mark as not done" : "Mark as done"}
        >
          {task.is_done ? "✓" : ""}
        </button>
      </form>

      <div className={styles.name}>
        <b>{task.name}</b>
        <span className={`${styles.badge} ${label.due ? styles.badgeDue : ""}`}>{label.text}</span>
        <div className={styles.meta}>
          {freqText(task.frequency_days)}
          {task.last_done && ` · last done ${shortDate(task.last_done)}`}
        </div>
      </div>

      <form action={toggleSelected}>
        <input type="hidden" name="taskId" value={task.id} />
        <button
          className={`${styles.ghost} ${styles.star} ${task.is_selected ? styles.starOn : ""}`}
          aria-label="Show in daily list"
        >
          {task.is_selected ? "★" : "☆"}
        </button>
      </form>
    </div>
  );
}