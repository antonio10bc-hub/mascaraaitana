import { json, readJSON, writeJSON } from "./_store.js";

const valid = s => s && typeof s.endpoint === "string" && s.endpoint.startsWith("https://") && s.keys && s.keys.p256dh && s.keys.auth;

export async function POST(request) {
  let sub;
  try { sub = await request.json(); } catch { return json({ error: "JSON inválido" }, 400); }
  if (!valid(sub)) return json({ error: "Suscripción inválida" }, 400);
  const subs = (await readJSON("subs.json", [])).filter(s => s.endpoint !== sub.endpoint);
  subs.push({ endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } });
  await writeJSON("subs.json", subs.slice(-10));
  return json({ ok: true });
}

export async function DELETE(request) {
  let body;
  try { body = await request.json(); } catch { return json({ error: "JSON inválido" }, 400); }
  const subs = await readJSON("subs.json", []);
  await writeJSON("subs.json", subs.filter(s => s.endpoint !== (body && body.endpoint)));
  return json({ ok: true });
}
