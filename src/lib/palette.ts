import {
  BookOpen,
  Brain,
  Code2,
  Coffee,
  Droplets,
  Dumbbell,
  Flame,
  Footprints,
  Heart,
  Languages,
  Leaf,
  Moon,
  Music,
  PenLine,
  Salad,
  Sparkles,
  Sun,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export const HABIT_COLORS = [
  { key: "ember", hex: "#FF6A3D", name: "Ember" },
  { key: "amber", hex: "#F5B942", name: "Amber" },
  { key: "lime", hex: "#A6E63D", name: "Lime" },
  { key: "teal", hex: "#3ECFB2", name: "Teal" },
  { key: "sky", hex: "#4CC2FF", name: "Sky" },
  { key: "violet", hex: "#9B8CFF", name: "Violet" },
  { key: "rose", hex: "#FB7A9B", name: "Rose" },
  { key: "bone", hex: "#E8E4D8", name: "Bone" },
] as const;

export function colorHex(key: string): string {
  return HABIT_COLORS.find((c) => c.key === key)?.hex ?? HABIT_COLORS[0].hex;
}

export const HABIT_ICONS: Record<string, LucideIcon> = {
  flame: Flame,
  droplets: Droplets,
  "book-open": BookOpen,
  "code-2": Code2,
  dumbbell: Dumbbell,
  "pen-line": PenLine,
  music: Music,
  sun: Sun,
  moon: Moon,
  brain: Brain,
  footprints: Footprints,
  coffee: Coffee,
  salad: Salad,
  languages: Languages,
  wallet: Wallet,
  leaf: Leaf,
  heart: Heart,
  sparkles: Sparkles,
};

export const ICON_KEYS = Object.keys(HABIT_ICONS);

export function iconFor(key: string): LucideIcon {
  return HABIT_ICONS[key] ?? Sparkles;
}
