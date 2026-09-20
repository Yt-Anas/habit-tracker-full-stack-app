import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { checkins, habits } from "@/db/schema";

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const habitId = Number(id);
  const body = await req.json().catch(() => null);
  const day = String(body?.day ?? "");

  if (!Number.isInteger(habitId) || !DAY_RE.test(day)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const [habit] = await db
    .select({ id: habits.id })
    .from(habits)
    .where(eq(habits.id, habitId))
    .limit(1);
  if (!habit) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await db
    .select({ id: checkins.id })
    .from(checkins)
    .where(and(eq(checkins.habitId, habitId), eq(checkins.day, day)))
    .limit(1);

  if (existing.length > 0) {
    await db.delete(checkins).where(eq(checkins.id, existing[0].id));
    return NextResponse.json({ checked: false });
  }

  await db.insert(checkins).values({ habitId, day }).onConflictDoNothing();
  return NextResponse.json({ checked: true });
}
