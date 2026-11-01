import { get, put } from "@vercel/blob";

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

export async function readJSON(path, fallback) {
  const r = await get(path, { access: "private", useCache: false });
  if (!r || r.statusCode !== 200) return fallback;
  try { return JSON.parse(await new Response(r.stream).text()); } catch { return fallback; }
}
export function writeJSON(path, data) {
  return put(path, JSON.stringify(data), {
    access: "private", addRandomSuffix: false, allowOverwrite: true,
    contentType: "application/json", cacheControlMaxAge: 60,
  });
}
export const isDay = s => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
export const todayIn = tz => new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

// Claves VAPID para push: se generan en el servidor la primera vez y se guardan en el blob privado
export async function getVapid() {
  let k = await readJSON("vapid.json", null);
  if (!k || !k.publicKey || !k.privateKey) {
    const webpush = (await import("web-push")).default;
    k = webpush.generateVAPIDKeys();
    await writeJSON("vapid.json", k);
  }
  return k;
}
