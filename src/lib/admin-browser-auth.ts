import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { getBrowserSupabase } from "./supabase-browser";

type BrowserAdminSessionResult =
  | {
      ok: true;
      email: string | null;
      session: Session;
    }
  | {
      ok: false;
      message: string;
    };

async function clearAdminSessionCookies(): Promise<void> {
  try {
    await fetch("/api/admin/session", {
      method: "DELETE"
    });
  } catch {
    // Ignore cookie cleanup failures in the browser and let the next request clear them.
  }
}

export async function signOutAdminBrowserSession(
  supabase: SupabaseClient | null = getBrowserSupabase()
): Promise<void> {
  const tasks: Promise<unknown>[] = [clearAdminSessionCookies()];

  if (supabase) {
    tasks.push(supabase.auth.signOut());
  }

  await Promise.allSettled(tasks);
}

export async function verifyAdminBrowserSession(
  supabase: SupabaseClient | null = getBrowserSupabase()
): Promise<BrowserAdminSessionResult> {
  if (!supabase) {
    return {
      ok: false,
      message: "Supabase Auth is not configured."
    };
  }

  const { data, error } = await supabase.auth.getSession();
  const session = data.session;

  if (error || !session?.access_token || !session.refresh_token) {
    await signOutAdminBrowserSession(supabase);
    return {
      ok: false,
      message: "You need to sign in before accessing the admin area."
    };
  }

  try {
    const response = await fetch("/api/admin/session", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        accessToken: session.access_token,
        refreshToken: session.refresh_token
      })
    });

    if (!response.ok) {
      const message = (await response.text().catch(() => "")) || "Admin access is required.";

      if (response.status === 401 || response.status === 403) {
        await signOutAdminBrowserSession(supabase);
      }

      return {
        ok: false,
        message
      };
    }

    const payload = await response.json().catch(() => null);

    return {
      ok: true,
      email: typeof payload?.email === "string" ? payload.email : session.user.email ?? null,
      session
    };
  } catch {
    return {
      ok: false,
      message: "Unable to verify admin access right now."
    };
  }
}
