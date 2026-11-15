import webpush from "web-push";
import { json, readJSON, writeJSON, todayIn, getVapid, hasMask } from "./_store.js";
import { CLIENT_ID, marksPath } from "./_auth.js";

// Lo llama el cron diario de Vercel (ver vercel.json). Si hoy ya está marcado, no avisa.
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  const ok = secret ? request.headers.get("authorization") === `Bearer ${secret}` : (request.headers.get("user-agent") || "").startsWith("vercel-cron");
  if (!ok) return json({ error: "No autorizado" }, 401);
  const force = new URL(request.url).searchParams.has("force");
  const today = todayIn("Europe/Madrid");
  const v = await getVapid();
  webpush.setVapidDetails("mailto:noreply@mascaraaitana.vercel.app", v.publicKey, v.privateKey);
  // Con login, cada suscripción es de un usuario; las antiguas sin usuario se descartan
  const subs = (await readJSON("subs.json", [])).map(s => ({ ...s, user: s.user || "legacy" })).filter(s => !CLIENT_ID || s.user !== "legacy");
  const payload = JSON.stringify({ title: "Máscara LED", body: "¿Te has puesto la máscara hoy?" });
  const done = {};
  const alive = [];
  let sent = 0, skipped = 0;
  for (const s of subs) {
    if (!(s.user in done)) {
      const m = await readJSON(marksPath(s.user), { days: [] });
      done[s.user] = !force && (m.days || []).some(d => d.split(":")[0] === today && hasMask(d));
    }
    if (done[s.user]) { skipped++; alive.push(s); continue; }
    try { await webpush.sendNotification(s, payload, { TTL: 6 * 3600, urgency: "high" }); sent++; alive.push(s); }
    catch (e) { if (e.statusCode !== 404 && e.statusCode !== 410) alive.push(s); }
  }
  await writeJSON("subs.json", alive);
  return json({ sent, skipped, today });
}
