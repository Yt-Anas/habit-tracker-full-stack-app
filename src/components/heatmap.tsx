"use client";

import { useMemo } from "react";
import { buildWeeks, formatDay, todayKey } from "@/lib/habit-utils";

interface HeatmapProps {
  days: Set<string>;
  hex: string;
  weeks?: number;
  onToggle?: (day: string) => void;
}

export default function Heatmap({ days, hex, weeks = 26, onToggle }: HeatmapProps) {
  const cols = useMemo(() => buildWeeks(weeks), [weeks]);
  const today = todayKey();

  return (
    <div className="flex w-fit gap-[3px]" role="grid" aria-label="Check-in history">
      {cols.map((col, i) => (
        <div key={i} className="flex flex-col gap-[3px]">
          {col.map((key) => {
            const future = key > today;
            const on = days.has(key);
            const base = "size-[10px] rounded-[3px] transition-all duration-150";
            const style = {
              backgroundColor: on ? hex : "rgba(255,255,255,0.07)",
              opacity: future ? 0.16 : 1,
            };
            if (future || !onToggle) {
              return (
                <div key={key} title={formatDay(key)} className={base} style={style} />
              );
            }
            return (
              <button
                key={key}
                type="button"
                title={`${formatDay(key)} — ${on ? "checked" : "empty"}`}
                aria-label={`${formatDay(key)} ${on ? "checked" : "unchecked"}`}
                onClick={() => onToggle(key)}
                className={`${base} hover:scale-125 hover:ring-1 hover:ring-white/50`}
                style={style}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
