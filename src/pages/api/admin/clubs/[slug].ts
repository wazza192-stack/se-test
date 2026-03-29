import type { APIRoute } from "astro";
import { requireAdminRequest } from "../../../../lib/admin-auth";
import { parseUpdateClubPayload } from "../../../../lib/club-page-admin";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

type ClubPageEditorRow = {
  slug: string;
  club_name: string;
  crest_url: string | null;
  summary: string | null;
  address: string | null;
  website_url: string | null;
  website_href: string | null;
  social_links: unknown;
  tour_booking_href: string | null;
  non_matchday_phone: string | null;
  non_matchday_email: string | null;
  matchday_phone: string | null;
  matchday_email: string | null;
  introduction_heading: string | null;
  introduction_paragraphs: unknown;
  spaces: unknown;
  events: unknown;
  christmas_text: string | null;
  play_on_pitch_text: string | null;
  tours_text: string | null;
  key_facts: unknown;
  map_embed_url: string | null;
  hero_image_url: string | null;
  christmas_image_url: string | null;
  play_on_pitch_image_url: string | null;
  published: boolean;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

const selectFields = `
  slug,
  club_name,
  crest_url,
  summary,
  address,
  website_url,
  website_href,
  social_links,
  tour_booking_href,
  non_matchday_phone,
  non_matchday_email,
  matchday_phone,
  matchday_email,
  introduction_heading,
  introduction_paragraphs,
  spaces,
  events,
  christmas_text,
  play_on_pitch_text,
  tours_text,
  key_facts,
  map_embed_url,
  hero_image_url,
  christmas_image_url,
  play_on_pitch_image_url,
  published,
  archived,
  created_at,
  updated_at
`;

export const GET: APIRoute = async ({ request, params }) => {
  const auth = await requireAdminRequest(request);

  if (!auth.ok) {
    return auth.response;
  }

  if (!supabaseAdmin) {
    return new Response("Supabase admin is not configured.", { status: 500 });
  }

  const slug = params.slug?.trim();

  if (!slug) {
    return new Response("Club slug is required.", { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("club_pages")
    .select(selectFields)
    .eq("slug", slug)
    .maybeSingle<ClubPageEditorRow>();

  if (error) {
    return new Response("Unable to load club draft.", { status: 500 });
  }

  if (!data) {
    return new Response("Club draft not found.", { status: 404 });
  }

  return Response.json(data);
};

export const PATCH: APIRoute = async ({ request, params }) => {
  const auth = await requireAdminRequest(request);

  if (!auth.ok) {
    return auth.response;
  }

  if (!supabaseAdmin) {
    return new Response("Supabase admin is not configured.", { status: 500 });
  }

  const currentSlug = params.slug?.trim();

  if (!currentSlug) {
    return new Response("Club slug is required.", { status: 400 });
  }

  const payload = parseUpdateClubPayload(await request.json().catch(() => null));

  if (!payload) {
    return new Response("Club content is incomplete.", { status: 400 });
  }

  if (payload.slug !== currentSlug) {
    const existing = await supabaseAdmin
      .from("club_pages")
      .select("slug")
      .eq("slug", payload.slug)
      .maybeSingle();

    if (existing.data?.slug) {
      return new Response("Another club already uses that slug.", { status: 409 });
    }
  }

  const { data, error } = await supabaseAdmin
    .from("club_pages")
    .update({
      ...payload,
      updated_at: new Date().toISOString()
    })
    .eq("slug", currentSlug)
    .select(selectFields)
    .single<ClubPageEditorRow>();

  if (error || !data) {
    return new Response("Unable to save the club draft.", { status: 500 });
  }

  return Response.json(data);
};

export const DELETE: APIRoute = async ({ request, params }) => {
  const auth = await requireAdminRequest(request);

  if (!auth.ok) {
    return auth.response;
  }

  if (!supabaseAdmin) {
    return new Response("Supabase admin is not configured.", { status: 500 });
  }

  const slug = params.slug?.trim();

  if (!slug) {
    return new Response("Club slug is required.", { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("club_pages")
    .update({
      archived: true,
      published: false,
      updated_at: new Date().toISOString()
    })
    .eq("slug", slug);

  if (error) {
    return new Response("Unable to archive the club.", { status: 500 });
  }

  return new Response(null, { status: 204 });
};
