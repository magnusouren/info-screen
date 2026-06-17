"use client";

import { useEffect, useState } from "react";
import {
  XIcon as X,
  PlusIcon as Plus,
  TrashIcon as Trash,
  HourglassIcon as Hourglass,
} from "@phosphor-icons/react";
import type { CountdownEntry } from "@/lib/types/countdown";
import { addEntry, getEntries, removeEntry } from "@/lib/countdowns";

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("no-NO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function CountdownModal({ onClose }: { onClose: () => void }) {
  const [entries, setEntries] = useState<CountdownEntry[]>([]);
  const [date, setDate] = useState(todayIso());
  const [description, setDescription] = useState("");

  useEffect(() => {
    setEntries(getEntries());
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const desc = description.trim();
    if (!desc || !date) return;
    setEntries(addEntry(date, desc));
    setDescription("");
  };

  const handleRemove = (id: string) => setEntries(removeEntry(id));

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-8"
      onClick={onClose}
      data-no-long-press
    >
      <div
        className="bg-surface border border-border rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2 text-text-2">
            <Hourglass size={18} weight="light" />
            <h2 className="text-base font-light tracking-wide">Nedtelling</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-3 hover:text-text-2 transition-colors -mr-1 -mt-1 p-1"
            aria-label="Lukk"
          >
            <X size={20} weight="light" />
          </button>
        </div>

        <div className="p-5 border-b border-border">
          <form onSubmit={submit} className="flex flex-col gap-3">
            <div className="flex gap-3">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-text-2 text-sm font-light flex-1 min-w-0"
              />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Beskrivelse"
                maxLength={60}
                required
                className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-text-2 text-sm font-light flex-1 min-w-0"
              />
            </div>
            <button
              type="submit"
              className="self-end flex items-center gap-1.5 bg-surface-2 hover:bg-surface border border-border rounded-lg px-3 py-2 text-text-2 text-sm font-light transition-colors"
            >
              <Plus size={14} weight="light" />
              Legg til
            </button>
          </form>
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          {sorted.length === 0 ? (
            <div className="text-text-4 text-sm font-light text-center py-4">
              Ingen oppføringer enda.
            </div>
          ) : (
            <ul className="space-y-1">
              {sorted.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center gap-3 px-2 py-2 -mx-2 rounded-lg hover:bg-surface-2/60"
                >
                  <span className="text-text-3 text-xs font-light tabular-nums w-24 shrink-0">
                    {formatDate(e.date)}
                  </span>
                  <span className="text-text-2 text-sm font-light flex-1 truncate">
                    {e.description}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemove(e.id)}
                    className="text-text-4 hover:text-text-2 transition-colors p-1"
                    aria-label={`Slett ${e.description}`}
                  >
                    <Trash size={16} weight="light" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
