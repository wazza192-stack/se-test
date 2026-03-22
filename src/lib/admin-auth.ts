import { supabaseAdmin } from "./supabase-admin";

export type AdminRequestAuthResult =
  | {
      ok: true;
      token: string;
      email: string | null;
      userId: string;
    }
  | {
      ok: false;
      response: Response;
    };

function getBearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");

  if (!authorization?.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  const token = authorization.slice(7).trim();
  return token || null;
}

export async function requireAdminRequest(request: Request): Promise<AdminRequestAuthResult> {
  if (!supabaseAdmin) {
    return {
      ok: false,
      response: new Response("Supabase admin is not configured.", { status: 500 })
    };
  }

  const token = getBearerToken(request);

  if (!token) {
    return {
      ok: false,
      response: new Response("Admin session is required.", { status: 401 })
    };
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    return {
      ok: false,
      response: new Response("Admin session could not be verified.", { status: 401 })
    };
  }

  return {
    ok: true,
    token,
    email: data.user.email ?? null,
    userId: data.user.id
  };
}
