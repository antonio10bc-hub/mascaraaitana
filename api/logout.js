import { clearCookie } from "./_auth.js";

export async function POST() {
  return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json", "set-cookie": clearCookie } });
}
