import { json, getVapid } from "./_store.js";

export async function GET() {
  const { publicKey } = await getVapid();
  return json({ publicKey });
}
