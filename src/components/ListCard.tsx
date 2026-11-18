import Link from "next/link";
import type { CSSProperties } from "react";
import { addTask, deleteTask, moveList, setListColor, toggleDone, toggleSelected } from "@/app/lists/actions";
import { shortDate } from "@/lib/dates";
import { HUES, dueLabel, freqText, sortTasks, type List, type Task } from "@/lib/tasks";
import styles from "@/styles/app.module.css";
import ListMenu from "./ListMenu";
import ManageTaskForm from "./ManageTaskForm";

type Props = { list: List; today: string; isFirst: boolean; isLast: boolean; managing: boolean };

export default function ListCard({ list, today, isFirst, isLast, managing }: Props) {
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
        {managing ? (
          <Link href="/lists" className={styles.saveLink} aria-label="Done managing">✓</Link>
        ) : (
          <ListMenu listId={list.id} />
        )}
      </div>

      {managing && <ColorPicker listId={list.id} current={list.hue} />}

      {tasks.length === 0 && <p className={styles.meta}>No tasks yet.</p>}
      {tasks.map((task) =>
        managing ? (
          <ManageRow key={task.id} task={task} today={today} />
        ) : (
          <TaskRow key={task.id} task={task} today={today} />
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

function ColorPicker({ listId, current }: { listId: string; current: number | null }) {
  return (
    <>
      <div className={styles.colorLabel}>List colour</div>
      <form action={setListColor} className={styles.swatches}>
        <input type="hidden" name="listId" value={listId} />
        <button name="hue" value="" className={`${styles.swatch} ${styles.swatchNone} ${current === null ? styles.swatchOn : ""}`} aria-label="No colour">✕</button>
        {HUES.map((h) => (
          <button
            key={h}
            name="hue"
            value={h}
            className={`${styles.swatch} ${current === h ? styles.swatchOn : ""}`}
            style={{ background: `hsl(${h} 70% 78%)` }}
            aria-label={`Colour ${h}`}
          />
        ))}
      </form>
    </>
  );
}

const fmtMin = (m: number) =>
  m < 60 ? `${m} min` : m % 60 === 0 ? `${m / 60} h` : `${Math.floor(m / 60)} h ${m % 60} min`;

function ManageRow({ task, today }: { task: Task; today: string }) {
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
      <form action={deleteTask}>
        <input type="hidden" name="taskId" value={task.id} />
        <button className={styles.ghost} aria-label="Delete task">✕</button>
      </form>
    </div>
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