import type { APIRoute } from "astro";

type GeocodeResult = {
  lat: number;
  lng: number;
  label: string;
} | null;

const CITY_FALLBACKS: Record<string, { lat: number; lng: number; label: string }> = {
  aberdeen: { lat: 57.1497, lng: -2.0943, label: "Aberdeen, United Kingdom" },
  belfast: { lat: 54.5973, lng: -5.9301, label: "Belfast, United Kingdom" },
  birmingham: { lat: 52.4862, lng: -1.8904, label: "Birmingham, United Kingdom" },
  blackburn: { lat: 53.7486, lng: -2.4875, label: "Blackburn, United Kingdom" },
  blackpool: { lat: 53.8142, lng: -3.0503, label: "Blackpool, United Kingdom" },
  bolton: { lat: 53.5769, lng: -2.4282, label: "Bolton, United Kingdom" },
  brentford: { lat: 51.4875, lng: -0.3094, label: "Brentford, United Kingdom" },
  brighton: { lat: 50.8225, lng: -0.1372, label: "Brighton, United Kingdom" },
  bristol: { lat: 51.4545, lng: -2.5879, label: "Bristol, United Kingdom" },
  cardiff: { lat: 51.4816, lng: -3.1791, label: "Cardiff, United Kingdom" },
  coventry: { lat: 52.4068, lng: -1.5197, label: "Coventry, United Kingdom" },
  doncaster: { lat: 53.5228, lng: -1.1285, label: "Doncaster, United Kingdom" },
  edinburgh: { lat: 55.9533, lng: -3.1883, label: "Edinburgh, United Kingdom" },
  glasgow: { lat: 55.8642, lng: -4.2518, label: "Glasgow, United Kingdom" },
  leeds: { lat: 53.8008, lng: -1.5491, label: "Leeds, United Kingdom" },
  leicester: { lat: 52.6369, lng: -1.1398, label: "Leicester, United Kingdom" },
  liverpool: { lat: 53.4084, lng: -2.9916, label: "Liverpool, United Kingdom" },
  london: { lat: 51.5072, lng: -0.1276, label: "London, United Kingdom" },
  manchester: { lat: 53.4808, lng: -2.2426, label: "Manchester, United Kingdom" },
  middlesbrough: { lat: 54.5742, lng: -1.2348, label: "Middlesbrough, United Kingdom" },
  newcastle: { lat: 54.9783, lng: -1.6178, label: "Newcastle upon Tyne, United Kingdom" },
  norwich: { lat: 52.6309, lng: 1.2974, label: "Norwich, United Kingdom" },
  nottingham: { lat: 52.9548, lng: -1.1581, label: "Nottingham, United Kingdom" },
  plymouth: { lat: 50.3755, lng: -4.1427, label: "Plymouth, United Kingdom" },
  portsmouth: { lat: 50.8198, lng: -1.0880, label: "Portsmouth, United Kingdom" },
  preston: { lat: 53.7632, lng: -2.7031, label: "Preston, United Kingdom" },
  reading: { lat: 51.4543, lng: -0.9781, label: "Reading, United Kingdom" },
  sheffield: { lat: 53.3811, lng: -1.4701, label: "Sheffield, United Kingdom" },
  southampton: { lat: 50.9097, lng: -1.4044, label: "Southampton, United Kingdom" },
  stoke: { lat: 53.0027, lng: -2.1794, label: "Stoke-on-Trent, United Kingdom" },
  sunderland: { lat: 54.9069, lng: -1.3838, label: "Sunderland, United Kingdom" },
  swansea: { lat: 51.6214, lng: -3.9436, label: "Swansea, United Kingdom" },
  twickenham: { lat: 51.4479, lng: -0.3398, label: "Twickenham, United Kingdom" },
  wolverhampton: { lat: 52.5862, lng: -2.1288, label: "Wolverhampton, United Kingdom" },
  york: { lat: 53.96, lng: -1.0873, label: "York, United Kingdom" }
};

function normalizePostcode(query: string): string | null {
  const normalized = query.replace(/\s+/g, "").toUpperCase();
  return /^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(normalized) ? normalized : null;
}

function extractPostcodeFromText(query: string): string | null {
  const match = query.toUpperCase().match(/\b([A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})\b/);
  return match ? normalizePostcode(match[1]) : null;
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim();

  if (!query) {
    return new Response(JSON.stringify({ result: null, error: "Missing query." }), {
      status: 400,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }

  try {
    const postcode = normalizePostcode(query) ?? extractPostcodeFromText(query);

    if (postcode) {
      const postcodeResponse = await fetch(`https://api.postcodes.io/postcodes/${postcode}`, {
        headers: {
          Accept: "application/json"
        }
      });

      if (postcodeResponse.ok) {
        const postcodeData = await postcodeResponse.json();
        const result = postcodeData?.result;

        if (result && typeof result.latitude === "number" && typeof result.longitude === "number") {
          return new Response(
            JSON.stringify({
              result: {
                lat: result.latitude,
                lng: result.longitude,
                label: `${result.postcode}, United Kingdom`
              }
            }),
            {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "public, max-age=3600"
              }
            }
          );
        }
      }
    }

    const cityFallback = CITY_FALLBACKS[query.toLowerCase()];

    if (cityFallback) {
      return new Response(JSON.stringify({ result: cityFallback }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=86400"
        }
      });
    }

    const upstreamUrl = new URL("https://nominatim.openstreetmap.org/search");
    upstreamUrl.searchParams.set("format", "jsonv2");
    upstreamUrl.searchParams.set("limit", "1");
    upstreamUrl.searchParams.set("countrycodes", "gb");
    upstreamUrl.searchParams.set("q", query);

    const response = await fetch(upstreamUrl, {
      headers: {
        Accept: "application/json",
        "Accept-Language": "en-GB,en;q=0.9",
        "User-Agent": "StadiumExperienceSite/1.0 (public venue search)"
      }
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ result: null, error: "Upstream geocoder unavailable." }), {
        status: 502,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }

    const data = await response.json();
    const first = Array.isArray(data) ? data[0] : null;
    const result: GeocodeResult = first
      ? {
          lat: Number(first.lat),
          lng: Number(first.lon),
          label: String(first.display_name ?? query)
        }
      : null;

    return new Response(JSON.stringify({ result }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600"
      }
    });
  } catch {
    return new Response(JSON.stringify({ result: null, error: "Geocoding failed." }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
};
