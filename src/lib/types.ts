export interface Habit {
  id: number;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  targetDays: number;
  createdAt: string;
}

export interface Checkin {
  id: number;
  habitId: number;
  day: string; // YYYY-MM-DD
}

export interface HabitsPayload {
  habits: Habit[];
  checkins: Checkin[];
}
