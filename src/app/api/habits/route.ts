import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { checkins, habits } from "@/db/schema";

export async function GET() {
  const [habitRows, checkinRows] = await Promise.all([
    db.select().from(habits).orderBy(asc(habits.id)),
    db.select().from(checkins),
  ]);
  return NextResponse.json({ habits: habitRows, checkins: checkinRows });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const [row] = await db
    .insert(habits)
    .values({
      name,
      description: String(body?.description ?? "").trim() || null,
      color: String(body?.color ?? "ember"),
      icon: String(body?.icon ?? "sparkles"),
      targetDays: Math.min(7, Math.max(1, Number(body?.targetDays) || 7)),
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
