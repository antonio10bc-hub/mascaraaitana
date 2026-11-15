import { CLIENT_ID, verifyGoogle, sessionCookie, cookies } from "./_auth.js";

// Google (modo redirect) envía aquí un formulario con el token; se crea la sesión y se vuelve a la app
export async function POST(request) {
  const back = (q, cookie) => new Response(null, { status: 303, headers: { location: "/" + q, ...(cookie ? { "set-cookie": cookie } : {}) } });
  if (!CLIENT_ID) return back("?login=off");
  try {
    const form = await request.formData();
    const csrf = form.get("g_csrf_token");
    if (!csrf || csrf !== cookies(request).g_csrf_token) return back("?login=error");
    const user = await verifyGoogle(String(form.get("credential") || ""));
    return back("", await sessionCookie(user));
  } catch {
    return back("?login=error");
  }
}
