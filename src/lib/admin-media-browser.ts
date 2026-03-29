import type { SupabaseClient } from "@supabase/supabase-js";
import type { MediaUploadTarget } from "./media-storage";
import { getBrowserSupabase } from "./supabase-browser";

async function getAdminAccessToken(supabase: SupabaseClient | null): Promise<string> {
  if (!supabase) {
    throw new Error("Supabase Auth is not configured.");
  }

  const { data, error } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (error || !token) {
    throw new Error("Admin session is required.");
  }

  return token;
}

export async function uploadAdminMediaFile(
  options: {
    file: File;
    target: MediaUploadTarget;
  },
  supabase: SupabaseClient | null = getBrowserSupabase()
): Promise<{ objectKey: string; url: string }> {
  const token = await getAdminAccessToken(supabase);
  const formData = new FormData();

  formData.set("file", options.file);
  formData.set("kind", options.target.kind);

  if (options.target.kind === "club") {
    formData.set("clubSlug", options.target.clubSlug);
    formData.set("slot", options.target.slot);
  } else if (options.target.kind === "news") {
    formData.set("slug", options.target.slug);
    if (options.target.publishedAt) {
      formData.set("publishedAt", options.target.publishedAt);
    }
    formData.set("slot", options.target.slot ?? "cover");
  } else {
    formData.set("slug", options.target.slug);
    formData.set("type", options.target.type);
  }

  const response = await fetch("/api/admin/media/upload", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    const message = (await response.text().catch(() => "")) || "Unable to upload the image.";
    throw new Error(message);
  }

  const payload = await response.json().catch(() => null);

  if (typeof payload?.url !== "string" || typeof payload?.objectKey !== "string") {
    throw new Error("Upload completed, but the media response was invalid.");
  }

  return payload;
}
