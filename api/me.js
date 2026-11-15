import { json } from "./_store.js";
import { CLIENT_ID, getUser } from "./_auth.js";

export async function GET(request) {
  if (!CLIENT_ID) return json({ auth: false });
  return json({ auth: true, clientId: CLIENT_ID, user: await getUser(request) });
}
