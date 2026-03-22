import { newsPosts, supplierFeatures, venues, type NewsPost, type SupplierFeature, type Venue } from "../data/site";
import { supabase } from "./supabase";

type SupabaseVenueRow = {
  slug: string;
  name: string;
  city: string;
  region: string;
  summary: string | null;
  hero_copy: string | null;
  guest_capacity_min: number | null;
  guest_capacity_max: number | null;
  enquiry_email: string | null;
};

function mapVenueRow(row: SupabaseVenueRow): Venue {
  const max = row.guest_capacity_max;
  const min = row.guest_capacity_min;
  const capacityLabel =
    max && min ? `${min}-${max} guests` : max ? `Up to ${max} guests` : "Capacity on request";

  return {
    slug: row.slug,
    name: row.name,
    city: row.city,
    region: row.region,
    heroImage: "/assets/stadium-experience/hero-team-shot.jpg",
    summary: row.summary ?? "Flexible event venue in the Stadium Experience network.",
    description:
      row.hero_copy ??
      "Discover a flexible event venue within the Stadium Experience network, with direct enquiry routes and practical planning information for event buyers.",
    guestCapacityLabel: capacityLabel,
    eventTypes: ["Meetings", "Conferences"],
    features: ["Structured content"],
    spaces: [],
    contactEmail: row.enquiry_email ?? "office@stadiumexperience.com"
  };
}

export async function getVenues(): Promise<Venue[]> {
  if (!supabase) {
    return venues;
  }

  const { data, error } = await supabase
    .from("venues")
    .select("slug, name, city, region, summary, hero_copy, guest_capacity_min, guest_capacity_max, enquiry_email")
    .eq("published", true)
    .order("name");

  if (error || !data?.length) {
    return venues;
  }

  return data.map(mapVenueRow);
}

export async function getVenueBySlug(slug: string): Promise<Venue | undefined> {
  const allVenues = await getVenues();
  return allVenues.find((venue) => venue.slug === slug);
}

export async function getNewsPosts(): Promise<NewsPost[]> {
  return newsPosts;
}

export async function getNewsPostBySlug(slug: string): Promise<NewsPost | undefined> {
  const posts = await getNewsPosts();
  return posts.find((post) => post.slug === slug);
}

export async function getSupplierFeatures(): Promise<SupplierFeature[]> {
  return supplierFeatures;
}
