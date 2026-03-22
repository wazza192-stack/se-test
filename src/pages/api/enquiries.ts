import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../lib/supabase-admin";
import { getVenueBySlug } from "../../lib/content";

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const companyName = String(formData.get("companyName") ?? "").trim();
  const enquiryType = String(formData.get("enquiryType") ?? "").trim();
  const venueSlug = String(formData.get("venueId") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !enquiryType || !message) {
    return new Response("Missing required fields.", { status: 400 });
  }

  if (!supabaseAdmin) {
    return new Response(
      "Thanks, your enquiry has been received. Connect Supabase credentials to store submissions automatically.",
      { status: 200 }
    );
  }

  const venue = venueSlug ? await getVenueBySlug(venueSlug) : undefined;

  const { error } = await supabaseAdmin.from("enquiries").insert({
    enquiry_type: enquiryType,
    name,
    email,
    company_name: companyName || null,
    message,
    venue_id: null,
    venue_slug: venue?.slug ?? (venueSlug || null)
  });

  if (error) {
    return new Response("Unable to save enquiry right now.", { status: 500 });
  }

  return new Response("Thanks, your enquiry has been sent.", { status: 200 });
};
