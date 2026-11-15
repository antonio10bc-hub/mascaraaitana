import { SignJWT, jwtVerify, createRemoteJWKSet } from "jose";
import { readJSON, writeJSON } from "./_store.js";

// Login con Google. Sin GOOGLE_CLIENT_ID configurado la app funciona como antes (sin login, datos compartidos).
export const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const COOKIE = "mascara_session";
const google = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

let secretCache = null;
async function secret() {
  if (secretCache) return secretCache;
  let s = await readJSON("session-secret.json", null);
  if (!s || !s.key) {
    s = { key: Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64") };
    await writeJSON("session-secret.json", s);
  }
  return (secretCache = new Uint8Array(Buffer.from(s.key, "base64")));
}

export async function verifyGoogle(idToken) {
  const { payload } = await jwtVerify(idToken, google, { audience: CLIENT_ID, issuer: ["https://accounts.google.com", "accounts.google.com"] });
  if (!payload.email_verified) throw new Error("email sin verificar");
  return { sub: payload.sub, email: payload.email, name: payload.given_name || payload.name || "", picture: payload.picture || "" };
}

export async function sessionCookie(user) {
  const token = await new SignJWT(user).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("365d").sign(await secret());
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${365 * 86400}`;
}
export const clearCookie = `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;

export function cookies(request) {
  const out = {};
  (request.headers.get("cookie") || "").split(/;\s*/).forEach(c => { const i = c.indexOf("="); if (i > 0) out[c.slice(0, i)] = decodeURIComponent(c.slice(i + 1)); });
  return out;
}

export async function getUser(request) {
  const t = cookies(request)[COOKIE];
  if (!t) return null;
  try { const { payload } = await jwtVerify(t, await secret()); return { sub: payload.sub, email: payload.email, name: payload.name, picture: payload.picture }; }
  catch { return null; }
}

// Ruta de datos del usuario. null = no autorizado. Sin login configurado se usa el archivo compartido de siempre.
export async function userKey(request) {
  if (!CLIENT_ID) return "legacy";
  const u = await getUser(request);
  return u ? u.sub : null;
}
export const marksPath = key => key === "legacy" ? "marks.json" : `users/${key}/marks.json`;
