import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Add it to your .env file first.");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const DAY_MS = 24 * 60 * 60 * 1000;

function key(daysAgo) {
  const d = new Date(Date.now() - daysAgo * DAY_MS);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const HABITS = [
  {
    name: "Morning run",
    description: "5km before the world wakes up",
    color: "ember",
    icon: "footprints",
    targetDays: 5,
  },
  {
    name: "Meditate",
    description: "Ten minutes of stillness",
    color: "teal",
    icon: "brain",
    targetDays: 7,
  },
  {
    name: "Read 20 pages",
    description: "Fiction before bed",
    color: "violet",
    icon: "book-open",
    targetDays: 7,
  },
  {
    name: "Ship code",
    description: "Push at least one commit",
    color: "lime",
    icon: "code-2",
    targetDays: 6,
  },
  {
    name: "No sugar",
    description: "Sweet-tooth embargo",
    color: "rose",
    icon: "salad",
    targetDays: 6,
  },
];

function historyFor(name) {
  const days = new Set();
  const addIf = (daysAgo, p) => {
    if (Math.random() < p) days.add(daysAgo);
  };
  if (name === "Morning run") {
    for (let i = 0; i <= 11; i++) days.add(i);
    for (let i = 12; i <= 90; i++) addIf(i, 0.5);
  } else if (name === "Meditate") {
    for (let i = 0; i <= 23; i++) days.add(i);
    for (let i = 24; i <= 120; i++) addIf(i, 0.78);
  } else if (name === "Read 20 pages") {
    for (let i = 2; i <= 60; i++) addIf(i, 0.85);
  } else if (name === "Ship code") {
    for (let i = 0; i <= 4; i++) days.add(i);
    for (let i = 5; i <= 90; i++) addIf(i, 0.6);
  } else {
    for (let i = 1; i <= 45; i++) addIf(i, 0.4);
  }
  return [...days].map(key);
}

async function main() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      "SELECT count(*)::int AS n FROM habits",
    );
    if (rows[0].n > 0) {
      console.log("Habits table is not empty — skipping seed.");
      return;
    }
    await client.query("BEGIN");
    for (const h of HABITS) {
      const {
        rows: [habit],
      } = await client.query(
        "INSERT INTO habits (name, description, color, icon, target_days) VALUES ($1,$2,$3,$4,$5) RETURNING id",
        [h.name, h.description, h.color, h.icon, h.targetDays],
      );
      for (const day of historyFor(h.name)) {
        await client.query(
          "INSERT INTO habit_checkins (habit_id, day) VALUES ($1,$2) ON CONFLICT DO NOTHING",
          [habit.id, day],
        );
      }
    }
    await client.query("COMMIT");
    const {
      rows: [c],
    } = await client.query("SELECT count(*)::int AS n FROM habit_checkins");
    console.log(`Seeded ${HABITS.length} habits with ${c.n} check-ins.`);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
