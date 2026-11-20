"use client";

import { useOptimistic, useTransition } from "react";
import { deleteTask, moveList, setListColor, toggleDone, toggleSelected } from "@/app/lists/actions";
import type { List } from "@/lib/tasks";
import styles from "@/styles/app.module.css";
import ListCard from "./ListCard";

type Action =
  | { type: "done"; id: string }
  | { type: "star"; id: string }
  | { type: "deleteTask"; id: string }
  | { type: "move"; listId: string; direction: 1 | -1 }
  | { type: "color"; listId: string; hue: number | null };

type Props = { lists: List[]; today: string; managingId?: string };

export default function ListsBoard({ lists, today, managingId }: Props) {
  const [, startTransition] = useTransition();

  // the "what the screen shows right now" copy of the lists, changed instantly by apply()
  const [shown, apply] = useOptimistic(lists, (current: List[], a: Action): List[] => {
    switch (a.type) {
      case "done":
        // same rule as the server: ticking remembers the old date, unticking restores it
        return current.map((l) => ({
          ...l,
          tasks: l.tasks.map((t) =>
            t.id !== a.id
              ? t
              : t.is_done
                ? { ...t, is_done: false, last_done: t.prev_done, prev_done: null }
                : { ...t, is_done: true, prev_done: t.last_done, last_done: today },
          ),
        }));
      case "star":
        return current.map((l) => ({
          ...l,
          tasks: l.tasks.map((t) => (t.id === a.id ? { ...t, is_selected: !t.is_selected } : t)),
        }));
      case "deleteTask":
        return current.map((l) => ({ ...l, tasks: l.tasks.filter((t) => t.id !== a.id) }));
      case "move": {
        const i = current.findIndex((l) => l.id === a.listId);
        const j = i + a.direction;
        if (i < 0 || j < 0 || j >= current.length) return current;
        const next = [...current];
        [next[i], next[j]] = [next[j], next[i]];
        return next;
      }
      case "color":
        return current.map((l) => (l.id === a.listId ? { ...l, hue: a.hue } : l));
    }
  });

  // 1) change the screen now  2) tell the server in the background
  function run(action: Action, serverCall: (formData: FormData) => Promise<void>, fields: Record<string, string>) {
    startTransition(async () => {
      apply(action);
      const formData = new FormData();
      for (const [name, value] of Object.entries(fields)) formData.set(name, value);
      await serverCall(formData);
    });
  }

  return (
    <>
      {shown.length === 0 && <p className={styles.empty}>No lists yet. Create your first one below.</p>}
      {shown.map((list, i) => (
        <ListCard
          key={list.id}
          list={list}
          today={today}
          isFirst={i === 0}
          isLast={i === shown.length - 1}
          managing={managingId === list.id}
          onToggleDone={(id) => run({ type: "done", id }, toggleDone, { taskId: id })}
          onToggleStar={(id) => run({ type: "star", id }, toggleSelected, { taskId: id })}
          onDeleteTask={(id) => run({ type: "deleteTask", id }, deleteTask, { taskId: id })}
          onMove={(direction) =>
            run({ type: "move", listId: list.id, direction }, moveList, { listId: list.id, direction: String(direction) })
          }
          onColor={(hue) =>
            run({ type: "color", listId: list.id, hue }, setListColor, { listId: list.id, hue: hue === null ? "" : String(hue) })
          }
        />
      ))}
    </>
  );
}