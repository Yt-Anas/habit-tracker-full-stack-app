import {
  date,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const habits = pgTable("habits", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").notNull().default("ember"),
  icon: text("icon").notNull().default("sparkles"),
  targetDays: integer("target_days").notNull().default(7),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const checkins = pgTable(
  "habit_checkins",
  {
    id: serial("id").primaryKey(),
    habitId: integer("habit_id")
      .notNull()
      .references(() => habits.id, { onDelete: "cascade" }),
    day: date("day", { mode: "string" }).notNull(),
  },
  (t) => [uniqueIndex("habit_checkins_habit_day_unique").on(t.habitId, t.day)],
);

export type HabitRow = typeof habits.$inferSelect;
export type CheckinRow = typeof checkins.$inferSelect;
