import { json, readJSON, writeJSON, isDay, isEntry } from "./_store.js";
import { userKey, marksPath } from "./_auth.js";

const noAuth = () => json({ error: "Inicia sesión" }, 401);

export async function GET(request) {
  const key = await userKey(request);
  if (!key) return noAuth();
  const data = await readJSON(marksPath(key), null);
  return json({ days: data ? data.days : null });
}

export async function PUT(request) {
  const key = await userKey(request);
  if (!key) return noAuth();
  let body;
  try { body = await request.json(); } catch { return json({ error: "JSON inválido" }, 400); }
  const days = body && body.days;
  if (!Array.isArray(days) || days.length > 10000 || !days.every(isEntry)) return json({ error: "Datos inválidos" }, 400);
  const clean = [...new Map(days.map(d => [d.split(":")[0], d])).values()].sort();
  await writeJSON(marksPath(key), { days: clean, updatedAt: Date.now() });
  return json({ ok: true, count: clean.length });
}

// Añade un solo día (lo usa el botón "Sí" de la notificación)
export async function POST(request) {
  const key = await userKey(request);
  if (!key) return noAuth();
  let body;
  try { body = await request.json(); } catch { return json({ error: "JSON inválido" }, 400); }
  if (!isDay(body && body.day)) return json({ error: "Día inválido" }, 400);
  const data = await readJSON(marksPath(key), { days: [] });
  // "Sí" = máscara hecha: vacío -> máscara; retinol/glicólico solos -> combinados; el resto se respeta
  const up = { r: "mr", g: "mg" };
  let found = false;
  const days = (data.days || []).map(d => {
    const [k, t] = d.split(":");
    if (k !== body.day) return d;
    found = true;
    return up[t] ? `${k}:${up[t]}` : d;
  });
  if (!found) days.push(body.day);
  await writeJSON(marksPath(key), { days: days.sort(), updatedAt: Date.now() });
  return json({ ok: true });
}
