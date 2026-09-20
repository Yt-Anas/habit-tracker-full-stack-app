"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Leaf, X } from "lucide-react";
import { HABIT_COLORS, HABIT_ICONS, ICON_KEYS } from "@/lib/palette";
import type { Habit } from "@/lib/types";

interface HabitModalProps {
  open: boolean;
  initial: Habit | null;
  onClose: () => void;
  onSaved: (habit: Habit, isNew: boolean) => void;
}

export default function HabitModal({ open, initial, onClose, onSaved }: HabitModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("ember");
  const [icon, setIcon] = useState("sparkles");
  const [targetDays, setTargetDays] = useState(7);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setDescription(initial?.description ?? "");
      setColor(initial?.color ?? "ember");
      setIcon(initial?.icon ?? "sparkles");
      setTargetDays(initial?.targetDays ?? 7);
      setErr(null);
      setSaving(false);
    }
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const submit = async () => {
    if (!name.trim()) {
      setErr("Give your ritual a name.");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch(initial ? `/api/habits/${initial.id}` : "/api/habits", {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          color,
          icon,
          targetDays,
        }),
      });
      if (!res.ok) throw new Error();
      const habit = (await res.json()) as Habit;
      onSaved(habit, !initial);
    } catch {
      setErr("Could not save. Try again.");
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[28px] border border-white/10 bg-[#121215] p-7 shadow-2xl md:p-9"
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
          >
            <button
              onClick={onClose}
              title="Close"
              className="absolute right-5 top-5 grid size-9 place-items-center rounded-full border border-white/10 text-white/50 transition-colors hover:border-white/30 hover:text-white"
            >
              <X className="size-4" />
            </button>

            <p className="ff-mono mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/40">
              <Leaf className="size-3.5" />
              {initial ? "Edit ritual" : "New ritual"}
            </p>
            <h3 className="ff-display mb-7 text-3xl leading-tight md:text-4xl">
              {initial ? "Refine the practice." : "What will you practice?"}
            </h3>

            <div className="flex flex-col gap-5">
              <div>
                <label htmlFor="ritual-name" className="ff-mono mb-2 block text-[10px] uppercase tracking-[0.3em] text-white/40">
                  Name
                </label>
                <input
                  id="ritual-name"
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="Morning run, Read 20 pages…"
                  maxLength={60}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[15px] transition-colors placeholder:text-white/25 focus:border-white/40"
                />
              </div>

              <div>
                <label htmlFor="ritual-desc" className="ff-mono mb-2 block text-[10px] uppercase tracking-[0.3em] text-white/40">
                  Description <span className="text-white/25">— optional</span>
                </label>
                <input
                  id="ritual-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="5km before the world wakes up"
                  maxLength={120}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[15px] transition-colors placeholder:text-white/25 focus:border-white/40"
                />
              </div>

              <div>
                <span className="ff-mono mb-2 block text-[10px] uppercase tracking-[0.3em] text-white/40">
                  Icon
                </span>
                <div className="grid grid-cols-6 gap-2 sm:grid-cols-9">
                  {ICON_KEYS.map((k) => {
                    const I = HABIT_ICONS[k];
                    const on = icon === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        title={k}
                        onClick={() => setIcon(k)}
                        className="grid aspect-square place-items-center rounded-xl border transition-all hover:border-white/40"
                        style={{
                          borderColor: on ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.1)",
                          backgroundColor: on ? "rgba(255,255,255,0.08)" : "transparent",
                          color: on ? "#EDEAE2" : "rgba(255,255,255,0.45)",
                        }}
                      >
                        <I className="size-4" strokeWidth={1.8} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="ff-mono mb-2 block text-[10px] uppercase tracking-[0.3em] text-white/40">
                  Color
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {HABIT_COLORS.map((c) => {
                    const on = color === c.key;
                    return (
                      <button
                        key={c.key}
                        type="button"
                        title={c.name}
                        onClick={() => setColor(c.key)}
                        className="size-9 rounded-full transition-transform hover:scale-110"
                        style={{
                          backgroundColor: c.hex,
                          boxShadow: on
                            ? `0 0 0 2px #121215, 0 0 0 4.5px ${c.hex}`
                            : "0 0 0 1px rgba(255,255,255,0.12)",
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="ff-mono mb-2 block text-[10px] uppercase tracking-[0.3em] text-white/40">
                  Weekly target
                </span>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7].map((d) => {
                    const on = targetDays === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setTargetDays(d)}
                        className="ff-mono flex-1 rounded-lg border py-2.5 text-sm transition-all"
                        style={{
                          backgroundColor: on ? "#EDEAE2" : "transparent",
                          borderColor: on ? "transparent" : "rgba(255,255,255,0.12)",
                          color: on ? "#0A0A0C" : "rgba(255,255,255,0.5)",
                        }}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
                <p className="ff-mono mt-2 text-[10px] uppercase tracking-[0.2em] text-white/30">
                  {targetDays === 7 ? "Every day" : `${targetDays} days a week`}
                </p>
              </div>

              {err && (
                <p className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-2.5 text-sm text-rose-300">
                  {err}
                </p>
              )}

              <div className="mt-1 flex items-center justify-end gap-3">
                <button
                  onClick={onClose}
                  className="ff-mono rounded-full px-5 py-2.5 text-xs uppercase tracking-[0.2em] text-white/50 transition-colors hover:text-white"
                >
                  Cancel
                </button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={submit}
                  disabled={saving}
                  className="rounded-full bg-[#EDEAE2] px-6 py-2.5 text-sm font-medium text-[#0A0A0C] transition-opacity disabled:opacity-50"
                >
                  {saving ? "Saving…" : initial ? "Save changes" : "Plant ritual"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
