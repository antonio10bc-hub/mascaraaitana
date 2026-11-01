import webpush from "web-push";
import { json, readJSON, writeJSON, todayIn, getVapid } from "./_store.js";

// Lo llama el cron diario de Vercel (ver vercel.json). Si hoy ya está marcado, no avisa.
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  const ok = secret ? request.headers.get("authorization") === `Bearer ${secret}` : (request.headers.get("user-agent") || "").startsWith("vercel-cron");
  if (!ok) return json({ error: "No autorizado" }, 401);
  const force = new URL(request.url).searchParams.has("force");
  const today = todayIn("Europe/Madrid");
  const marks = await readJSON("marks.json", { days: [] });
  if (!force && (marks.days || []).includes(today)) return json({ skipped: "ya marcado", today });

  const v = await getVapid();
  webpush.setVapidDetails("mailto:noreply@mascaraaitana.vercel.app", v.publicKey, v.privateKey);
  const subs = await readJSON("subs.json", []);
  const payload = JSON.stringify({ title: "Máscara LED", body: "¿Te has puesto la máscara hoy?" });
  const alive = [];
  let sent = 0;
  for (const s of subs) {
    try { await webpush.sendNotification(s, payload, { TTL: 6 * 3600, urgency: "high" }); sent++; alive.push(s); }
    catch (e) { if (e.statusCode !== 404 && e.statusCode !== 410) alive.push(s); }
  }
  if (alive.length !== subs.length) await writeJSON("subs.json", alive);
  return json({ sent, today });
}
