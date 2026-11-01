import { json, readJSON, writeJSON, isDay } from "./_store.js";

export async function GET() {
  const data = await readJSON("marks.json", null);
  return json({ days: data ? data.days : null });
}

export async function PUT(request) {
  let body;
  try { body = await request.json(); } catch { return json({ error: "JSON inválido" }, 400); }
  const days = body && body.days;
  if (!Array.isArray(days) || days.length > 10000 || !days.every(isDay)) return json({ error: "Datos inválidos" }, 400);
  const clean = [...new Set(days)].sort();
  await writeJSON("marks.json", { days: clean, updatedAt: Date.now() });
  return json({ ok: true, count: clean.length });
}

// Añade un solo día (lo usa el botón "Sí" de la notificación)
export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return json({ error: "JSON inválido" }, 400); }
  if (!isDay(body && body.day)) return json({ error: "Día inválido" }, 400);
  const data = await readJSON("marks.json", { days: [] });
  const days = new Set(data.days || []);
  days.add(body.day);
  await writeJSON("marks.json", { days: [...days].sort(), updatedAt: Date.now() });
  return json({ ok: true });
}
