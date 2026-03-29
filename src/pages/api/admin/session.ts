import type { APIRoute } from "astro";
import {
  appendAdminCookieHeaders,
  clearAdminSessionCookies,
  resolveAdminSession,
  shouldUseSecureAdminCookies,
  writeAdminSessionCookies
} from "../../../lib/admin-session";

function parseToken(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const secure = shouldUseSecureAdminCookies(new URL(request.url));
  const body = await request.json().catch(() => null);
  const accessToken = parseToken(body?.accessToken);
  const refreshToken = parseToken(body?.refreshToken);

  if (!accessToken || !refreshToken) {
    clearAdminSessionCookies(cookies, secure);
    return appendAdminCookieHeaders(cookies, new Response("Admin session is required.", { status: 401 }));
  }

  const resolvedSession = await resolveAdminSession(accessToken, refreshToken);

  if (!resolvedSession.ok) {
    clearAdminSessionCookies(cookies, secure);
    return appendAdminCookieHeaders(
      cookies,
      new Response(resolvedSession.message, { status: resolvedSession.status })
    );
  }

  writeAdminSessionCookies(cookies, resolvedSession, secure);

  return appendAdminCookieHeaders(
    cookies,
    Response.json({
      email: resolvedSession.email,
      userId: resolvedSession.userId
    })
  );
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  clearAdminSessionCookies(cookies, shouldUseSecureAdminCookies(new URL(request.url)));
  return appendAdminCookieHeaders(cookies, new Response(null, { status: 204 }));
};
