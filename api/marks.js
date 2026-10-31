import { get, put } from "@vercel/blob";

const PATH = "marks.json";
const noStore = { "content-type": "application/json", "cache-control": "no-store" };
const isDay = s => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

export async function GET() {
  const r = await get(PATH, { access: "private", useCache: false });
  if (!r || r.statusCode !== 200) return new Response(JSON.stringify({ days: null }), { headers: noStore });
  const text = await new Response(r.stream).text();
  return new Response(text, { headers: noStore });
}

export async function PUT(request) {
  let body;
  try { body = await request.json(); } catch { return new Response("JSON inválido", { status: 400 }); }
  const days = body && body.days;
  if (!Array.isArray(days) || days.length > 10000 || !days.every(isDay))
    return new Response("Datos inválidos", { status: 400 });
  const clean = [...new Set(days)].sort();
  await put(PATH, JSON.stringify({ days: clean, updatedAt: Date.now() }), {
    access: "private", addRandomSuffix: false, allowOverwrite: true,
    contentType: "application/json", cacheControlMaxAge: 60,
  });
  return new Response(JSON.stringify({ ok: true, count: clean.length }), { headers: noStore });
}
