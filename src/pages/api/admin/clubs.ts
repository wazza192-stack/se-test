import type { APIRoute } from "astro";
import { requireAdminRequest } from "../../../lib/admin-auth";
import { getPublishedClubDirectory } from "../../../lib/club-directory";
import { makeEmptyClubDraft, parseCreateClubPayload } from "../../../lib/club-page-admin";
import { supabaseAdmin } from "../../../lib/supabase-admin";

type ClubPageListRow = {
  slug: string;
  club_name: string;
  crest_url: string | null;
  venue_name: string | null;
  published: boolean;
  updated_at: string | null;
};

export const GET: APIRoute = async ({ request }) => {
  const auth = await requireAdminRequest(request);

  if (!auth.ok) {
    return auth.response;
  }

  if (!supabaseAdmin) {
    return new Response("Supabase admin is not configured.", { status: 500 });
  }

  const { data, error } = (await supabaseAdmin
    .from("club_pages")
    .select("slug, club_name, crest_url, venue_name, published, updated_at")
    .order("club_name")) as { data: ClubPageListRow[] | null; error: unknown };

  if (error) {
    return new Response("Unable to load club pages.", { status: 500 });
  }

  return Response.json({
    clubs: data ?? []
  });
};

export const POST: APIRoute = async ({ request }) => {
  const auth = await requireAdminRequest(request);

  if (!auth.ok) {
    return auth.response;
  }

  if (!supabaseAdmin) {
    return new Response("Supabase admin is not configured.", { status: 500 });
  }

  const payload = parseCreateClubPayload(await request.json().catch(() => null));

  if (!payload) {
    return new Response("A club name is required.", { status: 400 });
  }

  const existing = (await supabaseAdmin
    .from("club_pages")
    .select("slug")
    .eq("slug", payload.slug)
    .maybeSingle()) as { data: { slug: string } | null; error: unknown };

  if (existing.data?.slug) {
    return new Response("A club with that name already exists.", { status: 409 });
  }

  let crestUrl: string | null = null;

  try {
    const clubs = await getPublishedClubDirectory();
    const matchingClub = clubs.find((club) => club.name.localeCompare(payload.name, "en", { sensitivity: "base" }) === 0);
    crestUrl = matchingClub?.crestUrl ?? null;
  } catch (error) {
    console.error("Unable to enrich new club draft with crest", error);
  }

  const draft = {
    ...makeEmptyClubDraft(payload.name, crestUrl)
  };

  const { data, error } = await supabaseAdmin
    .from("club_pages")
    .insert(draft)
    .select("slug, club_name, crest_url, venue_name, published, updated_at")
    .single<ClubPageListRow>();

  if (error || !data) {
    return new Response("Unable to create the new club draft.", { status: 500 });
  }

  return Response.json(data, { status: 201 });
};
