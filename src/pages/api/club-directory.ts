import type { APIRoute } from "astro";
import { getPublishedClubDirectory } from "../../lib/club-directory";

export const GET: APIRoute = async () => {
  try {
    const clubs = await getPublishedClubDirectory();

    return Response.json({
      clubs: clubs.map((club) => ({
        name: club.name,
        crest_url: club.crestUrl
      }))
    });
  } catch (error) {
    console.error("Unable to load public club directory", error);
    return new Response("Unable to load club directory.", { status: 500 });
  }
};
