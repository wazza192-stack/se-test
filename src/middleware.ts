import { defineMiddleware } from "astro:middleware";
import {
  appendAdminCookieHeaders,
  clearAdminSessionCookies,
  readAdminSessionTokens,
  resolveAdminSession,
  shouldUseSecureAdminCookies,
  writeAdminSessionCookies
} from "./lib/admin-session";

function isAdminLoginPath(pathname: string): boolean {
  return pathname === "/admin/login" || pathname === "/admin/login/";
}

export const onRequest = defineMiddleware(async (context, next) => {
  if (!context.url.pathname.startsWith("/admin")) {
    return next();
  }

  const secure = shouldUseSecureAdminCookies(context.url);
  const isLoginPage = isAdminLoginPath(context.url.pathname);
  const { accessToken, refreshToken } = readAdminSessionTokens(context.cookies);
  const resolvedSession = await resolveAdminSession(accessToken, refreshToken);

  if (!resolvedSession.ok) {
    clearAdminSessionCookies(context.cookies, secure);

    if (isLoginPage) {
      const response = await next();
      return appendAdminCookieHeaders(context.cookies, response);
    }

    return appendAdminCookieHeaders(context.cookies, context.redirect("/admin/login/"));
  }

  writeAdminSessionCookies(context.cookies, resolvedSession, secure);

  if (isLoginPage) {
    return appendAdminCookieHeaders(context.cookies, context.redirect("/admin/"));
  }

  const response = await next();
  return appendAdminCookieHeaders(context.cookies, response);
});
