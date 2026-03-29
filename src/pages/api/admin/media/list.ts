import type { APIRoute } from "astro";
import { requireAdminRequest } from "../../../../lib/admin-auth";
import {
  type MediaUploadTarget,
  isImageKitConfigured,
  listMediaLibraryItems
} from "../../../../lib/media-storage";

function asString(value: string | null): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function parseTarget(searchParams: URLSearchParams): MediaUploadTarget | null {
  const kind = asString(searchParams.get("kind"));

  if (kind === "club") {
    const clubSlug = asString(searchParams.get("clubSlug"));
    const slot = asString(searchParams.get("slot"));

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
    const slug = asString(searchParams.get("slug"));
    const slot = asString(searchParams.get("slot"));

    if (!slug || (slot && !["cover", "og"].includes(slot))) {
      return null;
    }

    return {
      kind,
      slug,
      slot: (slot as "cover" | "og" | null) ?? "cover",
      publishedAt: asString(searchParams.get("publishedAt"))
    };
  }

  if (kind === "awards") {
    const slug = asString(searchParams.get("slug"));
    const type = asString(searchParams.get("type"));

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

export const GET: APIRoute = async ({ request }) => {
  const auth = await requireAdminRequest(request);

  if (!auth.ok) {
    return auth.response;
  }

  if (!isImageKitConfigured()) {
    return new Response("ImageKit is not configured.", { status: 500 });
  }

  const url = new URL(request.url);
  const target = parseTarget(url.searchParams);

  if (!target) {
    return new Response("A valid media-library target is required.", { status: 400 });
  }

  const limit = Number(url.searchParams.get("limit") ?? "24");
  const skip = Number(url.searchParams.get("skip") ?? "0");

  try {
    const result = await listMediaLibraryItems({
      target,
      limit: Number.isFinite(limit) && limit > 0 ? limit : 24,
      skip: Number.isFinite(skip) && skip >= 0 ? skip : 0
    });

    return Response.json(result);
  } catch (error) {
    return new Response(error instanceof Error ? error.message : "Unable to load media library items.", {
      status: 400
    });
  }
};
