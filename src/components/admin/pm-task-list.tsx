"use client";

import { useState, useTransition } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import {
  addPmTaskAction,
  setPmTaskDoneAction,
  deletePmTaskAction,
} from "@/app/admin/_actions/wrappers";
import type { PmTaskRow } from "@/lib/types/database";

export function PmTaskList({
  projectId,
  initial,
}: {
  projectId: string;
  initial: PmTaskRow[];
}) {
  const [tasks, setTasks] = useState<PmTaskRow[]>(initial);
  const [title, setTitle] = useState("");
  const [, startTransition] = useTransition();

  const doneCount = tasks.filter((t) => t.done).length;

  function add(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    setTitle("");
    startTransition(async () => {
      const res = await addPmTaskAction(projectId, t);
      if (res.ok && res.task) setTasks((arr) => [...arr, res.task as PmTaskRow]);
    });
  }

  function toggle(task: PmTaskRow) {
    const done = !task.done;
    setTasks((arr) => arr.map((x) => (x.id === task.id ? { ...x, done } : x)));
    startTransition(() => {
      void setPmTaskDoneAction(task.id, projectId, done);
    });
  }

  function remove(id: string) {
    setTasks((arr) => arr.filter((x) => x.id !== id));
    startTransition(() => {
      void deletePmTaskAction(id, projectId);
    });
  }

  return (
    <div className="surface-card p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <h2 className="t-heading-l font-display">Tasks</h2>
        <span className="t-mono text-muted text-xs">
          {doneCount} / {tasks.length} done
        </span>
      </div>

      <ul className="mt-5 space-y-1.5">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="flex items-center gap-3 py-2 border-b border-border last:border-0 group"
          >
            <button
              type="button"
              onClick={() => toggle(task)}
              aria-label={task.done ? "Mark not done" : "Mark done"}
              className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition ${
                task.done
                  ? "bg-brand-500/20 border-brand-500/60 text-brand-500"
                  : "border-border hover:border-border-strong"
              }`}
            >
              {task.done ? <Check className="w-3.5 h-3.5" /> : null}
            </button>
            <span
              className={`flex-1 t-small ${
                task.done ? "text-muted line-through" : "text-fg"
              }`}
            >
              {task.title}
            </span>
            <button
              type="button"
              onClick={() => remove(task.id)}
              aria-label="Delete task"
              className="text-muted hover:text-danger transition opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </li>
        ))}
        {tasks.length === 0 ? (
          <li className="t-small text-muted py-2">No tasks yet.</li>
        ) : null}
      </ul>

      <form onSubmit={add} className="flex items-center gap-2 mt-4">
        <input
          className="input flex-1"
          placeholder="Add a task…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button type="submit" className="btn btn-secondary">
          <Plus className="w-4 h-4" /> Add
        </button>
      </form>
    </div>
  );
}
