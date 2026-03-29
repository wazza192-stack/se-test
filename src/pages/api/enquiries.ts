import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../lib/supabase-admin";
import { getVenueBySlug } from "../../lib/content";

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const telephone = String(formData.get("telephone") ?? "").trim();
  const eventDate = String(formData.get("eventDate") ?? "").trim();
  const companyName = String(formData.get("companyName") ?? "").trim();
  const enquiryType = String(formData.get("enquiryType") ?? "venue").trim() || "venue";
  const venueSlug = String(formData.get("venueId") ?? "").trim();
  const guestCount = String(formData.get("guestCount") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !telephone || !enquiryType || !venueSlug || !guestCount || !message) {
    return new Response("Missing required fields.", { status: 400 });
  }

  if (!supabaseAdmin) {
    return new Response(
      "Thanks, your enquiry has been received. Connect Supabase credentials to store submissions automatically.",
      { status: 200 }
    );
  }

  const venue = venueSlug ? await getVenueBySlug(venueSlug) : undefined;

  const messageParts = [
    `Telephone: ${telephone}`,
    `Expected guests: ${guestCount}`,
    eventDate ? `Date of event: ${eventDate}` : null,
    "",
    message
  ].filter(Boolean);

  const { error } = await supabaseAdmin.from("enquiries").insert({
    enquiry_type: enquiryType,
    name,
    email,
    company_name: companyName || null,
    message: messageParts.join("\n"),
    venue_id: null,
    venue_slug: venue?.slug ?? (venueSlug || null)
  });

  if (error) {
    return new Response("Unable to save enquiry right now.", { status: 500 });
  }

  return new Response("Thanks, your enquiry has been sent.", { status: 200 });
};
