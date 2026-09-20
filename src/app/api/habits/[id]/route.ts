import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { habits } from "@/db/schema";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const habitId = Number(id);
  if (!Number.isInteger(habitId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = (await req.json().catch(() => null)) ?? {};
  const patch: Partial<typeof habits.$inferInsert> = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    patch.name = name;
  }
  if (body.description !== undefined) {
    patch.description = String(body.description).trim() || null;
  }
  if (body.color !== undefined) patch.color = String(body.color);
  if (body.icon !== undefined) patch.icon = String(body.icon);
  if (body.targetDays !== undefined) {
    patch.targetDays = Math.min(7, Math.max(1, Number(body.targetDays) || 7));
  }

  const [row] = await db
    .update(habits)
    .set(patch)
    .where(eq(habits.id, habitId))
    .returning();

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const habitId = Number(id);
  if (!Number.isInteger(habitId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const [row] = await db
    .delete(habits)
    .where(eq(habits.id, habitId))
    .returning({ id: habits.id });

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
