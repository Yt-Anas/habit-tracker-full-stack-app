"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  AlertTriangle,
  Check,
  Flame,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react";
import HabitModal from "@/components/habit-modal";
import Heatmap from "@/components/heatmap";
import {
  addDays,
  bestStreak,
  currentStreak,
  formatDay,
  monthRate,
  prettyToday,
  toKey,
  todayKey,
  weekCount,
} from "@/lib/habit-utils";
import { colorHex, iconFor } from "@/lib/palette";
import type { Habit, HabitsPayload } from "@/lib/types";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const EMPTY = new Set<string>();

const parent: Variants = {
  show: { transition: { staggerChildren: 0.07 } },
};
const child: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

/* ------------------------------------------------------------------ */

function Ring({ done, total }: { done: number; total: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? done / total : 0;
  return (
    <div className="relative size-16">
      <svg viewBox="0 0 64 64" className="size-16 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
        <motion.circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ type: "spring", stiffness: 60, damping: 18 }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FF6A3D" />
            <stop offset="100%" stopColor="#9B8CFF" />
          </linearGradient>
        </defs>
      </svg>
      <div className="ff-mono absolute inset-0 grid place-items-center text-sm">
        {done}
        <span className="text-white/40">/{total}</span>
      </div>
    </div>
  );
}

function SectionLabel({ index, title, hint }: { index: string; title: string; hint?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div className="flex items-baseline gap-3">
        <span className="ff-mono text-xs text-white/25">{index}</span>
        <h2 className="ff-mono text-xs uppercase tracking-[0.35em] text-white/60">{title}</h2>
      </div>
      {hint && (
        <span className="ff-mono text-[11px] uppercase tracking-[0.2em] text-white/30">{hint}</span>
      )}
    </div>
  );
}

function WeekDots({ days, hex }: { days: Set<string>; hex: string }) {
  const now = new Date();
  const dow = (now.getDay() + 6) % 7;
  const monday = addDays(now, -dow);
  const letters = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <div className="flex items-center gap-1.5">
      {letters.map((l, i) => {
        const d = addDays(monday, i);
        const key = toKey(d);
        const future = d > now;
        const on = days.has(key);
        return (
          <div
            key={i}
            title={formatDay(key)}
            className="ff-mono grid size-5 place-items-center rounded-full text-[9px]"
            style={{
              backgroundColor: on ? hex : "rgba(255,255,255,0.05)",
              color: on ? "#0A0A0C" : future ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.4)",
            }}
          >
            {l}
          </div>
        );
      })}
    </div>
  );
}

function CheckButton({ checked, hex, onClick }: { checked: boolean; hex: string; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.82 }}
      onClick={onClick}
      aria-pressed={checked}
      title={checked ? "Mark as not done" : "Mark as done"}
      className="relative grid size-12 shrink-0 place-items-center rounded-full border-2 transition-shadow duration-300"
      style={
        checked
          ? { backgroundColor: hex, borderColor: hex, boxShadow: `0 0 28px ${hex}66` }
          : { backgroundColor: "transparent", borderColor: "rgba(255,255,255,0.14)" }
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        {checked ? (
          <motion.span
            key="on"
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 520, damping: 22 }}
          >
            <Check className="size-5 text-[#0A0A0C]" strokeWidth={3.2} />
          </motion.span>
        ) : (
          <motion.span
            key="off"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="size-1.5 rounded-full bg-white/25"
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function TodayRow({
  habit,
  days,
  index,
  onToggle,
  onEdit,
}: {
  habit: Habit;
  days: Set<string>;
  index: number;
  onToggle: (habit: Habit) => void;
  onEdit: (habit: Habit) => void;
}) {
  const hex = colorHex(habit.color);
  const checked = days.has(todayKey());
  const streak = currentStreak(days);
  const Icon = iconFor(habit.icon);

  return (
    <motion.div
      variants={child}
      className="group relative flex items-center gap-4 rounded-2xl border p-4 pr-5 transition-colors duration-300 md:gap-5 md:p-5 md:pr-6"
      style={{
        borderColor: checked ? `${hex}45` : "rgba(255,255,255,0.08)",
        backgroundColor: checked ? `${hex}0B` : "rgba(255,255,255,0.02)",
      }}
    >
      <span className="ff-mono hidden w-7 shrink-0 text-xs text-white/25 sm:block">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div
        className="grid size-11 shrink-0 place-items-center rounded-xl border md:size-12"
        style={{ backgroundColor: `${hex}14`, borderColor: `${hex}33` }}
      >
        <Icon className="size-5" style={{ color: hex }} strokeWidth={1.8} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2.5">
          <h3 className="truncate text-[15px] font-medium md:text-base">{habit.name}</h3>
          <button
            onClick={() => onEdit(habit)}
            title="Edit ritual"
            className="shrink-0 opacity-0 transition-opacity hover:text-white focus:opacity-100 group-hover:opacity-100"
          >
            <Pencil className="size-3.5 text-white/40" />
          </button>
        </div>
        <p className="truncate text-sm text-white/40">
          {habit.description ?? (habit.targetDays === 7 ? "Every day" : `${habit.targetDays} days a week`)}
        </p>
      </div>
      <div className="hidden shrink-0 lg:block">
        <WeekDots days={days} hex={hex} />
      </div>
      <div
        className="ff-mono flex w-14 shrink-0 items-center justify-end gap-1 text-sm"
        style={{ color: streak > 0 ? hex : "rgba(255,255,255,0.3)" }}
        title={streak > 0 ? `${streak} day streak` : "No streak yet"}
      >
        <Flame
          className="size-4"
          fill={streak > 0 ? hex : "transparent"}
          strokeWidth={streak > 0 ? 0 : 1.5}
        />
        {streak > 0 ? `${streak}d` : "—"}
      </div>
      <CheckButton checked={checked} hex={hex} onClick={() => onToggle(habit)} />
    </motion.div>
  );
}

function LedgerCard({
  habit,
  days,
  confirming,
  onToggleDay,
  onEdit,
  onDelete,
}: {
  habit: Habit;
  days: Set<string>;
  confirming: boolean;
  onToggleDay: (habit: Habit, day: string) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habit: Habit) => void;
}) {
  const hex = colorHex(habit.color);
  const Icon = iconFor(habit.icon);
  const streak = currentStreak(days);
  const best = bestStreak(days);
  const wk = weekCount(days);
  const rate = monthRate(days);
  const monthName = new Date().toLocaleDateString("en-US", { month: "short" }).toUpperCase();

  return (
    <motion.div
      variants={child}
      className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/[0.025] p-6 transition-colors duration-300 hover:border-white/20 md:p-7"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3.5">
          <div
            className="grid size-11 shrink-0 place-items-center rounded-xl border"
            style={{ backgroundColor: `${hex}14`, borderColor: `${hex}33` }}
          >
            <Icon className="size-5" style={{ color: hex }} strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-medium">{habit.name}</h3>
            <p className="truncate text-sm text-white/40">
              {habit.targetDays === 7 ? "Daily" : `${habit.targetDays}× a week`}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={() => onEdit(habit)}
            title="Edit ritual"
            className="grid size-9 place-items-center rounded-full border border-white/10 text-white/45 transition-colors hover:border-white/30 hover:text-white"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            onClick={() => onDelete(habit)}
            title={confirming ? "Click again to confirm" : "Delete ritual"}
            className="ff-mono grid h-9 place-items-center rounded-full border text-xs transition-all"
            style={
              confirming
                ? {
                    borderColor: "rgba(251,122,155,0.5)",
                    color: "#FB7A9B",
                    backgroundColor: "rgba(251,122,155,0.08)",
                    paddingInline: "0.9rem",
                  }
                : {
                    borderColor: "rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.45)",
                    width: "2.25rem",
                  }
            }
          >
            {confirming ? "Sure?" : <Trash2 className="size-3.5" />}
          </button>
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-3">
          <span className="ff-display text-[64px] leading-none">{streak}</span>
          <span className="ff-mono text-[11px] uppercase tracking-[0.25em] text-white/40">
            day streak
          </span>
        </div>
        <Flame
          className="size-10 opacity-90"
          style={{ color: streak > 0 ? hex : "rgba(255,255,255,0.12)" }}
          fill={streak > 0 ? `${hex}30` : "transparent"}
          strokeWidth={1.4}
        />
      </div>

      <div className="overflow-x-auto pb-1">
        <Heatmap days={days} hex={hex} weeks={26} onToggle={(day) => onToggleDay(habit, day)} />
      </div>

      <div className="ff-mono flex flex-wrap gap-x-5 gap-y-1 text-[11px] uppercase tracking-[0.15em] text-white/45">
        <span>
          Best <span style={{ color: "#EDEAE2" }}>{best}d</span>
        </span>
        <span>
          This week{" "}
          <span style={{ color: "#EDEAE2" }}>
            {wk}/{habit.targetDays}
          </span>
        </span>
        <span>
          {monthName} <span style={{ color: "#EDEAE2" }}>{rate}%</span>
        </span>
        <span>
          All-time <span style={{ color: "#EDEAE2" }}>{days.size}</span>
        </span>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */

export default function HabitApp() {
  const [data, setData] = useState<HabitsPayload | null>(null);
  const [error, setError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const today = todayKey();

  const say = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/habits", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const payload = (await res.json()) as HabitsPayload;
      setData(payload);
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const byHabit = useMemo(() => {
    const m = new Map<number, Set<string>>();
    for (const c of data?.checkins ?? []) {
      let set = m.get(c.habitId);
      if (!set) {
        set = new Set();
        m.set(c.habitId, set);
      }
      set.add(c.day);
    }
    return m;
  }, [data]);

  const habitsList = useMemo(() => data?.habits ?? [], [data]);
  const doneToday = habitsList.filter((h) => byHabit.get(h.id)?.has(today)).length;
  const totalCheckins = data?.checkins.length ?? 0;
  const bestActive = Math.max(0, ...habitsList.map((h) => currentStreak(byHabit.get(h.id) ?? EMPTY)));
  const weekWins = habitsList.reduce((acc, h) => acc + weekCount(byHabit.get(h.id) ?? EMPTY), 0);

  const toggle = useCallback(
    async (habit: Habit, day: string) => {
      const was = byHabit.get(habit.id)?.has(day) ?? false;
      // Optimistic update
      setData((prev) => {
        if (!prev) return prev;
        const checkins = was
          ? prev.checkins.filter((c) => !(c.habitId === habit.id && c.day === day))
          : [...prev.checkins, { id: -Date.now(), habitId: habit.id, day }];
        return { ...prev, checkins };
      });
      try {
        const res = await fetch(`/api/habits/${habit.id}/toggle`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ day }),
        });
        if (!res.ok) throw new Error();
        if (!was && day === today) {
          const next = new Set(byHabit.get(habit.id) ?? []);
          next.add(day);
          const s = currentStreak(next);
          say(s > 1 ? `${habit.name} — ${s} day streak` : `${habit.name} checked in`);
        }
      } catch {
        say("Something went wrong");
        load();
      }
    },
    [byHabit, load, say, today],
  );

  const remove = useCallback(
    async (habit: Habit) => {
      if (confirmDelete !== habit.id) {
        setConfirmDelete(habit.id);
        setTimeout(() => setConfirmDelete((c) => (c === habit.id ? null : c)), 2600);
        return;
      }
      setConfirmDelete(null);
      const backup = data;
      setData((prev) =>
        prev
          ? {
              habits: prev.habits.filter((h) => h.id !== habit.id),
              checkins: prev.checkins.filter((c) => c.habitId !== habit.id),
            }
          : prev,
      );
      try {
        const res = await fetch(`/api/habits/${habit.id}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
        say(`"${habit.name}" removed`);
      } catch {
        setData(backup);
        say("Delete failed");
      }
    },
    [confirmDelete, data, say],
  );

  const openNew = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (h: Habit) => {
    setEditing(h);
    setModalOpen(true);
  };

  const onSaved = (habit: Habit, isNew: boolean) => {
    setData((prev) => {
      if (!prev) return { habits: [habit], checkins: [] };
      return {
        ...prev,
        habits: isNew
          ? [...prev.habits, habit]
          : prev.habits.map((h) => (h.id === habit.id ? habit : h)),
      };
    });
    setModalOpen(false);
    setEditing(null);
    say(isNew ? "New ritual planted" : "Ritual updated");
  };

  const stats = [
    { label: "Done today", value: `${doneToday}/${habitsList.length}` },
    { label: "Total check-ins", value: String(totalCheckins) },
    { label: "Best active streak", value: `${bestActive}d` },
    { label: "Check-ins this week", value: String(weekWins) },
  ];

  return (
    <div className="relative min-h-screen">
      {/* ambient background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="orb-1 absolute -top-48 left-1/2 h-[560px] w-[840px] rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(closest-side, rgba(255,106,61,0.32), transparent)" }}
        />
        <div
          className="orb-2 absolute right-[-220px] top-1/3 h-[520px] w-[520px] rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(closest-side, rgba(155,140,255,0.4), transparent)" }}
        />
      </div>
      <div className="grain" aria-hidden />

      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0A0A0C]/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 md:px-8">
          <span className="flex items-center gap-2.5">
            <span
              className="size-2 rounded-full"
              style={{ background: "linear-gradient(135deg,#FF6A3D,#9B8CFF)" }}
            />
            <span className="ff-mono text-xs uppercase tracking-[0.45em]">
              Ritual<span className="text-white/35">®</span>
            </span>
          </span>
          <span className="ff-mono hidden text-[11px] uppercase tracking-[0.25em] text-white/40 md:block">
            {prettyToday()}
          </span>
          <span className="ff-mono rounded-full border border-white/10 px-3.5 py-1.5 text-[11px] text-white/60">
            {doneToday}/{habitsList.length} today
          </span>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-5 md:px-8">
        {/* hero */}
        <motion.section
          initial="hidden"
          animate="show"
          variants={parent}
          className="pb-14 pt-14 md:pb-20 md:pt-24"
        >
          <motion.div
            variants={child}
            className="ff-mono mb-8 flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-white/40"
          >
            <span>+ The daily practice</span>
            <span className="hidden sm:block">Est. 2026 — Vol. 01</span>
          </motion.div>
          <motion.h1
            variants={child}
            className="ff-display text-[clamp(3.2rem,9vw,7.5rem)] leading-[0.98] tracking-tight"
          >
            Small acts,
            <br />
            <em
              className="text-transparent"
              style={{
                backgroundImage: "linear-gradient(100deg,#FF6A3D,#9B8CFF 60%,#4CC2FF)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
              }}
            >
              repeated daily.
            </em>
          </motion.h1>
          <motion.div
            variants={child}
            className="mt-9 flex flex-col gap-8 md:flex-row md:items-end md:justify-between"
          >
            <p className="max-w-md text-base leading-relaxed text-white/50 md:text-lg">
              A tiny fullstack habit tracker. Check things off, keep streaks alive, and
              watch your year fill in — one square at a time.
            </p>
            <div className="flex items-center gap-4">
              <Ring done={doneToday} total={habitsList.length} />
              <div className="ff-mono text-[11px] uppercase leading-relaxed tracking-[0.2em] text-white/45">
                Today&apos;s
                <br />
                completion
              </div>
            </div>
          </motion.div>
        </motion.section>

        {/* stats strip */}
        <motion.section initial="hidden" animate="show" variants={parent}>
          <motion.div
            variants={child}
            className="grid grid-cols-2 border-y border-white/10 md:grid-cols-4 md:divide-x md:divide-white/10"
          >
            {stats.map((s) => (
              <div key={s.label} className="px-2 py-6 md:px-6">
                <p className="ff-mono mb-2 text-[10px] uppercase tracking-[0.25em] text-white/35">
                  {s.label}
                </p>
                <p className="ff-mono text-3xl md:text-4xl">{s.value}</p>
              </div>
            ))}
          </motion.div>
        </motion.section>

        {/* main content */}
        {error ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <AlertTriangle className="size-8 text-amber-400" strokeWidth={1.5} />
            <p className="ff-display text-3xl">The database went quiet.</p>
            <p className="max-w-sm text-sm text-white/45">
              We couldn&apos;t load your rituals. Check that PostgreSQL is running and try again.
            </p>
            <button
              onClick={load}
              className="ff-mono flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-xs uppercase tracking-[0.2em] text-white/70 transition-colors hover:border-white/40 hover:text-white"
            >
              <RefreshCw className="size-3.5" /> Retry
            </button>
          </div>
        ) : !data ? (
          <div className="flex flex-col gap-3 py-16 md:py-24">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[84px] animate-pulse rounded-2xl bg-white/[0.04]" />
            ))}
          </div>
        ) : habitsList.length === 0 ? (
          <motion.section
            initial="hidden"
            animate="show"
            variants={parent}
            className="flex flex-col items-center gap-6 py-24 text-center md:py-36"
          >
            <motion.div
              variants={child}
              className="flex flex-col items-center gap-6 rounded-3xl border border-dashed border-white/15 px-10 py-14 md:px-20"
            >
              <Sparkles className="size-8 text-white/30" strokeWidth={1.4} />
              <h2 className="ff-display text-4xl md:text-5xl">The page is blank.</h2>
              <p className="max-w-sm text-sm leading-relaxed text-white/45">
                Every streak starts with a single day. Plant your first ritual and begin.
              </p>
              <button
                onClick={openNew}
                className="flex items-center gap-2 rounded-full bg-[#EDEAE2] px-6 py-3 text-sm font-medium text-[#0A0A0C] transition-transform hover:scale-[1.04] active:scale-95"
              >
                <Plus className="size-4" /> New ritual
              </button>
            </motion.div>
          </motion.section>
        ) : (
          <>
            {/* today's lineup */}
            <motion.section
              initial="hidden"
              animate="show"
              variants={parent}
              className="pt-14 md:pt-20"
            >
              <motion.div variants={child}>
                <SectionLabel
                  index="01"
                  title="Today's lineup"
                  hint={`${doneToday} of ${habitsList.length} done`}
                />
              </motion.div>
              <div className="flex flex-col gap-3">
                {habitsList.map((h, i) => (
                  <TodayRow
                    key={h.id}
                    habit={h}
                    days={byHabit.get(h.id) ?? EMPTY}
                    index={i}
                    onToggle={(habit) => toggle(habit, today)}
                    onEdit={openEdit}
                  />
                ))}
              </div>
            </motion.section>

            {/* the ledger */}
            <motion.section
              initial="hidden"
              animate="show"
              variants={parent}
              className="py-14 md:py-20"
            >
              <motion.div variants={child}>
                <SectionLabel index="02" title="The ledger" hint="Click any square to backfill" />
              </motion.div>
              <div className="grid gap-5 lg:grid-cols-2">
                {habitsList.map((h) => (
                  <LedgerCard
                    key={h.id}
                    habit={h}
                    days={byHabit.get(h.id) ?? EMPTY}
                    confirming={confirmDelete === h.id}
                    onToggleDay={toggle}
                    onEdit={openEdit}
                    onDelete={remove}
                  />
                ))}
                <motion.button
                  variants={child}
                  onClick={openNew}
                  className="group flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-white/15 text-white/35 transition-colors hover:border-white/35 hover:text-white/70"
                >
                  <Plus className="size-6 transition-transform duration-300 group-hover:rotate-90" />
                  <span className="ff-mono text-[11px] uppercase tracking-[0.3em]">
                    Add a ritual
                  </span>
                </motion.button>
              </div>
            </motion.section>
          </>
        )}

        <footer className="border-t border-white/10 py-10">
          <div className="ff-mono flex flex-col items-start justify-between gap-2 text-[11px] uppercase tracking-[0.25em] text-white/30 md:flex-row">
            <span>Ritual — a fullstack habit studio</span>
            <span>Next.js · Drizzle · PostgreSQL</span>
          </div>
        </footer>
      </main>

      {/* modal + toast */}
      <HabitModal
        open={modalOpen}
        initial={editing}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSaved={onSaved}
      />

      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 16, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 8, x: "-50%" }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="ff-mono fixed bottom-7 left-1/2 z-50 flex items-center gap-2.5 rounded-full border border-white/10 bg-[#1A1A1E] px-5 py-3 text-xs tracking-wide text-white/85 shadow-2xl"
          >
            <Sparkles className="size-3.5 text-[#FF6A3D]" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
