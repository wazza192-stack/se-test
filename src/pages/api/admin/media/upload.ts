import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { requireAdminRequest } from "../../../../lib/admin-auth";
import {
  isMediaUploadConfigured,
  type MediaBucketLike,
  type MediaUploadTarget,
  uploadMediaFile
} from "../../../../lib/media-storage";

function asString(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getMediaBucket(): MediaBucketLike | null {
  return env.MEDIA_BUCKET ?? null;
}

function parseTarget(formData: FormData): MediaUploadTarget | null {
  const kind = asString(formData.get("kind"));

  if (kind === "club") {
    const clubSlug = asString(formData.get("clubSlug"));
    const slot = asString(formData.get("slot"));

    if (!clubSlug || !slot || !["crest", "hero", "christmas", "play-on-pitch"].includes(slot)) {
      return null;
    }

    return {
      kind,
      clubSlug,
      slot: slot as "crest" | "hero" | "christmas" | "play-on-pitch"
    };
  }

  if (kind === "news") {
    const slug = asString(formData.get("slug"));
    const slot = asString(formData.get("slot"));

    if (!slug || (slot && !["cover", "og"].includes(slot))) {
      return null;
    }

    return {
      kind,
      slug,
      slot: (slot as "cover" | "og" | null) ?? "cover",
      publishedAt: asString(formData.get("publishedAt"))
    };
  }

  if (kind === "awards") {
    const slug = asString(formData.get("slug"));
    const type = asString(formData.get("type"));

    if (!slug || !type || !["programme", "page", "category"].includes(type)) {
      return null;
    }

    return {
      kind,
      slug,
      type: type as "programme" | "page" | "category"
    };
  }

  return null;
}

export const POST: APIRoute = async ({ request, locals }) => {
  const auth = await requireAdminRequest(request);

  if (!auth.ok) {
    return auth.response;
  }

  const bucket = getMediaBucket();

  if (!isMediaUploadConfigured(bucket)) {
    return new Response(
      "No media upload provider is configured. Set IMAGEKIT_PRIVATE_KEY and PUBLIC_IMAGEKIT_URL_ENDPOINT, or bind MEDIA_BUCKET.",
      { status: 500 }
    );
  }

  const formData = await request.formData().catch(() => null);

  if (!formData) {
    return new Response("Upload form data is required.", { status: 400 });
  }

  const file = formData.get("file");
  const target = parseTarget(formData);

  if (!(file instanceof File)) {
    return new Response("An image file is required.", { status: 400 });
  }

  if (!target) {
    return new Response("A valid upload target is required.", { status: 400 });
  }

  try {
    const uploaded = await uploadMediaFile({
      bucket,
      file,
      target,
      uploadedBy: auth.userId
    });

    return Response.json(uploaded, { status: 201 });
  } catch (error) {
    return new Response(error instanceof Error ? error.message : "Unable to upload the image.", {
      status: 400
    });
  }
};
