import type { AstroCookies } from "astro";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "./supabase-admin";

const url = import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

export const ADMIN_ACCESS_COOKIE_NAME = "se_admin_access_token";
export const ADMIN_REFRESH_COOKIE_NAME = "se_admin_refresh_token";

const ADMIN_REFRESH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

type CookieReader = Pick<AstroCookies, "get">;
type CookieStore = Pick<AstroCookies, "set" | "delete" | "headers">;

type VerifiedAdminAccess =
  | {
      ok: true;
      email: string | null;
      userId: string;
    }
  | {
      ok: false;
      status: number;
      message: string;
    };

export type ResolvedAdminSession =
  | {
      ok: true;
      accessToken: string;
      refreshToken: string | null;
      email: string | null;
      userId: string;
      expiresAt: number | null;
    }
  | {
      ok: false;
      status: number;
      message: string;
    };

function getSupabaseAuthClient() {
  if (!url || !anonKey) {
    return null;
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const [, payload = ""] = token.split(".");

  if (!payload) {
    return null;
  }

  try {
    const normalised = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalised.padEnd(Math.ceil(normalised.length / 4) * 4, "=");
    const decoded = atob(padded);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function getTokenExpiry(token: string | null): number | null {
  if (!token) {
    return null;
  }

  const payload = decodeJwtPayload(token);
  return typeof payload?.exp === "number" ? payload.exp : null;
}

function getCookieOptions(secure: boolean, expiresAt?: number | null) {
  const options: {
    expires?: Date;
    httpOnly: true;
    maxAge?: number;
    path: "/";
    sameSite: "lax";
    secure: boolean;
  } = {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/"
  };

  if (typeof expiresAt === "number" && Number.isFinite(expiresAt)) {
    const maxAge = Math.max(0, expiresAt - Math.floor(Date.now() / 1000));
    options.maxAge = maxAge;
    options.expires = new Date(expiresAt * 1000);
  }

  return options;
}

async function verifyAdminAccessToken(token: string): Promise<VerifiedAdminAccess> {
  if (!supabaseAdmin) {
    return {
      ok: false,
      status: 500,
      message: "Supabase admin is not configured."
    };
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    return {
      ok: false,
      status: 401,
      message: "Admin session could not be verified."
    };
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle<{ role: string | null }>();

  if (profileError) {
    return {
      ok: false,
      status: 500,
      message: "Admin profile could not be verified."
    };
  }

  if (profile?.role !== "admin") {
    return {
      ok: false,
      status: 403,
      message: "Admin access is required."
    };
  }

  return {
    ok: true,
    email: data.user.email ?? null,
    userId: data.user.id
  };
}

async function refreshAdminSession(accessToken: string | null, refreshToken: string) {
  const authClient = getSupabaseAuthClient();

  if (!authClient) {
    return null;
  }

  const { data, error } = await authClient.auth.setSession({
    access_token: accessToken ?? "",
    refresh_token: refreshToken
  });

  if (error || !data.session) {
    return null;
  }

  return data.session;
}

export function shouldUseSecureAdminCookies(url: URL): boolean {
  return url.protocol === "https:";
}

export function appendAdminCookieHeaders(cookies: CookieStore, response: Response): Response {
  for (const value of cookies.headers()) {
    response.headers.append("Set-Cookie", value);
  }

  return response;
}

export function readAdminSessionTokens(cookies: CookieReader) {
  return {
    accessToken: cookies.get(ADMIN_ACCESS_COOKIE_NAME)?.value ?? null,
    refreshToken: cookies.get(ADMIN_REFRESH_COOKIE_NAME)?.value ?? null
  };
}

export function writeAdminSessionCookies(
  cookies: CookieStore,
  session: {
    accessToken: string;
    expiresAt?: number | null;
    refreshToken?: string | null;
  },
  secure: boolean
): void {
  cookies.set(
    ADMIN_ACCESS_COOKIE_NAME,
    session.accessToken,
    getCookieOptions(secure, session.expiresAt ?? getTokenExpiry(session.accessToken))
  );

  if (session.refreshToken) {
    cookies.set(ADMIN_REFRESH_COOKIE_NAME, session.refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: ADMIN_REFRESH_COOKIE_MAX_AGE_SECONDS,
      expires: new Date(Date.now() + ADMIN_REFRESH_COOKIE_MAX_AGE_SECONDS * 1000)
    });
  } else {
    cookies.delete(ADMIN_REFRESH_COOKIE_NAME, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/"
    });
  }
}

export function clearAdminSessionCookies(cookies: CookieStore, secure: boolean): void {
  const options = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/"
  };

  cookies.delete(ADMIN_ACCESS_COOKIE_NAME, options);
  cookies.delete(ADMIN_REFRESH_COOKIE_NAME, options);
}

export async function resolveAdminSession(
  accessToken: string | null,
  refreshToken: string | null
): Promise<ResolvedAdminSession> {
  if (!accessToken && !refreshToken) {
    return {
      ok: false,
      status: 401,
      message: "Admin session is required."
    };
  }

  if (accessToken) {
    const verifiedAccess = await verifyAdminAccessToken(accessToken);

    if (verifiedAccess.ok) {
      return {
        ok: true,
        accessToken,
        refreshToken,
        email: verifiedAccess.email,
        userId: verifiedAccess.userId,
        expiresAt: getTokenExpiry(accessToken)
      };
    }

    if (verifiedAccess.status === 403) {
      return verifiedAccess;
    }
  }

  if (!refreshToken) {
    return {
      ok: false,
      status: 401,
      message: "Admin session is required."
    };
  }

  const refreshedSession = await refreshAdminSession(accessToken, refreshToken);

  if (!refreshedSession?.access_token) {
    return {
      ok: false,
      status: 401,
      message: "Admin session could not be refreshed."
    };
  }

  const verifiedRefresh = await verifyAdminAccessToken(refreshedSession.access_token);

  if (!verifiedRefresh.ok) {
    return verifiedRefresh;
  }

  return {
    ok: true,
    accessToken: refreshedSession.access_token,
    refreshToken: refreshedSession.refresh_token ?? refreshToken,
    email: verifiedRefresh.email,
    userId: verifiedRefresh.userId,
    expiresAt: refreshedSession.expires_at ?? getTokenExpiry(refreshedSession.access_token)
  };
}
