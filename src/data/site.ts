export type VenueSpace = {
  name: string;
  theatre: number;
  dining: number;
  standing: number;
};

export type PlanningFact = {
  label: string;
  value: string;
};

export type Venue = {
  slug: string;
  name: string;
  city: string;
  region: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  crestImage?: string;
  heroImage: string;
  summary: string;
  description: string;
  guestCapacityLabel: string;
  planningFacts: PlanningFact[];
  eventTypes: string[];
  features: string[];
  spaces: VenueSpace[];
  contactEmail: string;
};

export type NewsPost = {
  slug: string;
  title: string;
  publishedAt: string;
  excerpt: string;
  body: string[];
  coverImage?: string | null;
  seo?: SeoMeta | null;
};

export type SupplierFeature = {
  slug: string;
  name: string;
  summary: string;
  category: string;
  body?: string[];
  sortOrder?: number | null;
  seo?: SeoMeta | null;
};

export type SeoMeta = {
  metaTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  canonicalPath?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  socialImage?: string | null;
  noindex?: boolean;
};

export type MarketingLink = {
  label: string;
  href: string;
};

export type MarketingPageHero = {
  eyebrow?: string | null;
  title: string;
  intro?: string | null;
};

export type MarketingCallout = {
  eyebrow?: string | null;
  title: string;
  body: string[];
  cta?: MarketingLink | null;
};

export type MarketingPageContent = {
  hero: MarketingPageHero;
  benefitsHeading?: string | null;
  benefits: string[];
  callout?: MarketingCallout | null;
  seo?: SeoMeta | null;
};

export type JobListing = {
  slug: string;
  title: string;
  location: string;
  crestUrl?: string | null;
  type: string;
  summary: string;
  sections: {
    heading: string;
    content?: string;
    body: string[];
    bullets?: {
      text: string;
      level: number;
    }[];
  }[];
  salary?: string | null;
  hours?: string | null;
  jobLocation?: string | null;
  closingDate?: string | null;
  applicationUrl?: string | null;
  contactEmail?: string | null;
};

export type EventItem = {
  title: string;
  date: string;
  summary: string;
};

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
};

export const stats = [
  { label: "Member venues", value: "70+" },
  { label: "Venue categories", value: "10+" },
  { label: "Commission", value: "0%" },
  { label: "Industry reach", value: "UK-wide" }
];

export const homepageSections = [
  {
    eyebrow: "Unique & Prestigious UK Stadium Venues",
    title: "Find a unique sporting venue for your next event",
    body:
      "Search by region, city, guest count and event type to shortlist memorable venues for conferences, meetings, exhibitions and celebrations."
  },
  {
    eyebrow: "Adaptable spaces for large and small events",
    title: "Meetings, conferences, exhibitions, dinners and celebrations",
    body:
      "From intimate board meetings to large-scale gala dinners, member venues offer flexible hospitality suites, boxes and event spaces with real personality."
  },
  {
    eyebrow: "Commission Free Enquiries",
    title: "A cleaner way to connect planners directly with member venues",
    body:
      "Enquire directly with venues across the network, compare options quickly and keep the planning process straightforward from first shortlist to booking."
  }
];

export const migrationPhases = [
  "Audit the current site, export every live page and preserve URL coverage before launch work begins.",
  "Model venues, news, awards, suppliers and enquiry data in Supabase with reusable fields and stable slugs.",
  "Rebuild the homepage, venue directory, venue detail pages and key lead capture flows first.",
  "Add redirects, analytics, newsletter capture and launch checks before switching the domain at Cloudflare."
];

export const eventCategories = [
  "Meetings",
  "Conferences",
  "Christmas parties",
  "Awards dinners",
  "Exhibitions",
  "Weddings"
];

export const venues: Venue[] = [
  {
    slug: "edgbaston-stadium",
    name: "Edgbaston Stadium",
    city: "Birmingham",
    region: "Midlands",
    heroImage: "/assets/stadium-experience/hero-team-shot.jpg",
    summary: "Major event venue with premium hospitality suites and flexible conference layouts.",
    description:
      "Edgbaston is well suited to awards, exhibitions and conferences that need a strong Midlands location, memorable views and varied room formats, with flexible hospitality spaces for both large and smaller events.",
    guestCapacityLabel: "Up to 800 guests",
    planningFacts: [
      { label: "Best for", value: "Awards dinners and exhibitions" },
      { label: "Spaces", value: "3 flexible event spaces" },
      { label: "Highlights", value: "Pitch views and breakout rooms" }
    ],
    eventTypes: ["Awards dinners", "Exhibitions", "Conferences"],
    features: ["Pitch views", "Breakout rooms", "Private dining", "On-site AV support"],
    spaces: [
      { name: "Banqueting Suite", theatre: 500, dining: 360, standing: 650 },
      { name: "Premium Lounge", theatre: 220, dining: 140, standing: 250 },
      { name: "Executive Box Collection", theatre: 40, dining: 24, standing: 40 }
    ],
    contactEmail: "events@edgbaston.example"
  },
  {
    slug: "headingley-stadium",
    name: "Headingley Stadium",
    city: "Leeds",
    region: "North",
    heroImage: "/assets/stadium-experience/headingley.jpg",
    summary: "Flexible Yorkshire venue for business events, hospitality and festive celebrations.",
    description:
      "Headingley works well for event buyers who want a high-recognition stadium venue outside London, with accessible meeting rooms, hospitality-led spaces and a strong mix of business and seasonal event options.",
    guestCapacityLabel: "Up to 500 guests",
    planningFacts: [
      { label: "Best for", value: "Meetings and festive events" },
      { label: "Spaces", value: "3 hospitality-led rooms" },
      { label: "Highlights", value: "Parking and hybrid-ready rooms" }
    ],
    eventTypes: ["Meetings", "Christmas parties", "Private dining"],
    features: ["City access", "Hospitality lounges", "Parking", "Hybrid-ready rooms"],
    spaces: [
      { name: "Centenary Pavilion", theatre: 350, dining: 220, standing: 450 },
      { name: "Howard Suite", theatre: 120, dining: 80, standing: 140 },
      { name: "Boardroom", theatre: 24, dining: 18, standing: 30 }
    ],
    contactEmail: "events@headingley.example"
  },
  {
    slug: "twickenham-stadium",
    name: "Twickenham Stadium",
    city: "London",
    region: "South",
    heroImage: "/assets/stadium-experience/hero-team-shot.jpg",
    summary: "Flagship London option for large-scale hospitality, conferences and gala events.",
    description:
      "Twickenham represents the top end of the network for capacity and profile, ideal for national events, large conferences and premium awards evenings. The final build can let users compare venue scale quickly while still preserving each location's personality.",
    guestCapacityLabel: "1000+ guests",
    planningFacts: [
      { label: "Best for", value: "Large conferences and gala events" },
      { label: "Spaces", value: "3 premium event settings" },
      { label: "Highlights", value: "London location and VIP hospitality" }
    ],
    eventTypes: ["Conferences", "Hospitality", "Awards dinners"],
    features: ["London location", "Large capacities", "VIP hospitality", "Signature event spaces"],
    spaces: [
      { name: "West Stand", theatre: 1100, dining: 750, standing: 1200 },
      { name: "Union Ale House", theatre: 280, dining: 180, standing: 350 },
      { name: "Executive Lounge", theatre: 90, dining: 60, standing: 120 }
    ],
    contactEmail: "events@twickenham.example"
  }
];

export const newsPosts: NewsPost[] = [
  {
    slug: "why-stadium-venues-win-corporate-events",
    title: "Why stadium venues keep winning corporate event briefs",
    publishedAt: "2026-03-10",
    excerpt:
      "Event buyers increasingly want built-in atmosphere, flexible capacities and memorable backdrops, which is exactly where stadium venues stand out.",
    body: [
      "Stadium venues combine practical event infrastructure with a sense of occasion that standard meeting hotels often struggle to match.",
      "Editorial content helps event planners discover venue ideas, seasonal inspiration and member success stories while strengthening the site’s organic visibility.",
      "A regular flow of venue news, campaign updates and practical planning content keeps the network visible throughout the year."
    ]
  },
  {
    slug: "awards-season-planning-starts-earlier-than-you-think",
    title: "Awards season planning starts earlier than you think",
    publishedAt: "2026-02-18",
    excerpt:
      "Awards and gala dinner enquiries often start months before buyers finalise budgets, which makes discovery pages and lead capture especially important.",
    body: [
      "A stronger awards journey can include category pages, venue suggestions, sponsor information and ticketing links without forcing everything into one generic section.",
      "That gives Stadium Experience a clearer route for both attendees and partner venues while keeping management of the content simpler."
    ]
  }
];

export const supplierFeatures: SupplierFeature[] = [
  {
    slug: "event-tech",
    name: "Event Technology Partners",
    summary: "Audio visual, staging and hybrid-event solutions designed for large venue teams.",
    category: "Technology",
    sortOrder: 1
  },
  {
    slug: "creative-services",
    name: "Creative Brand Activations",
    summary: "Campaign support for sponsors, event launches and on-site guest experiences.",
    category: "Marketing",
    sortOrder: 2
  },
  {
    slug: "hospitality-support",
    name: "Hospitality Operations Support",
    summary: "Specialist staffing and service support for busy seasonal event programmes.",
    category: "Operations",
    sortOrder: 3
  }
];

export const memberBenefits = [
  "A cleaner venue directory with reusable structured content",
  "Better search landing pages for event types and regions",
  "Improved enquiry capture and reporting via Supabase",
  "Faster page delivery and caching through Cloudflare"
];

export const enquiryBenefits = [
  "Commission-free venue enquiries routed to the right team",
  "A practical brief form that works for venue, awards and supplier leads",
  "A clearer hand-off for venues, with less manual chasing and fewer incomplete leads"
];

export const enquirySteps = [
  "Tell us about your event, timing and expected guest numbers.",
  "We route the enquiry to the most relevant venue or Stadium Experience contact.",
  "You receive a direct follow-up from the team best placed to help."
];

export const plannerTrustPoints = [
  "Direct contact with venue teams",
  "No commission on enquiries",
  "UK-wide stadium venue network",
  "Support for meetings, conferences and celebrations"
];

export const awardsHighlights = [
  "A dedicated awards hub with categories, FAQs, tickets and accommodation",
  "Reusable page sections for annual awards updates instead of one-off page edits",
  "Cleaner routes for sponsors, attendees and venue partners"
];

export const awardsFacts = [
  "Annual industry event for stadium hospitality and events professionals",
  "Opportunities for tickets, sponsorship, accommodation and partner visibility",
  "A clearer content structure for yearly launches and category updates"
];

export const supplierBenefits = [
  "Clearer ways to present products and services to member venues",
  "Routes into meetings, advertising and awards sponsorship",
  "More useful supplier content than a static brochure page"
];

export const newsContentBenefits = [
  "Editorial content that supports search visibility and member storytelling",
  "A stronger place for venue launches, seasonal campaigns and association updates",
  "Reusable article templates that are easier to manage year-round"
];

export const latestNewsPageContent: MarketingPageContent = {
  hero: {
    eyebrow: "Latest news",
    title: "Editorial content that keeps members visible and helps the site rank.",
    intro:
      "News, insight and venue updates are a major visibility driver for the network, especially when paired with category and regional landing pages."
  },
  benefitsHeading: "Keep the site active, useful and discoverable.",
  benefits: newsContentBenefits,
  callout: {
    eyebrow: "Stay updated",
    title: "Follow the latest venue and industry updates",
    body: [
      "Use editorial content to surface member news, venue launches, seasonal campaigns and practical advice for planners."
    ],
    cta: {
      label: "Ask about newsletter sign-up",
      href: "/enquire/"
    }
  }
};

export const suppliersPageContent: MarketingPageContent = {
  hero: {
    eyebrow: "Suppliers",
    title: "Partnership routes that help suppliers connect with stadium venues.",
    intro:
      "Explore how suppliers can introduce products and services to the network, support industry meetings and build visibility through awards-related activity."
  },
  benefitsHeading: "Useful routes into the network, not just a brochure page.",
  benefits: supplierBenefits,
  callout: {
    eyebrow: "Next step",
    title: "Talk to the team about the right route",
    body: [
      "Whether you want to advertise, present at meetings or support the awards, the first step is a practical conversation about the best fit."
    ],
    cta: {
      label: "Discuss supplier opportunities",
      href: "/enquire/"
    }
  }
};

export const venueSearchBenefits = [
  "Compare regions, capacities and event types quickly",
  "Shortlist venues with direct contact details and practical planning information",
  "Move from inspiration to enquiry without hidden commission or extra handoffs"
];

export const testimonials: Testimonial[] = [
  {
    quote: "The network gives planners a faster way to shortlist memorable venues without losing the direct relationship with the team on site.",
    name: "Sarah Blake",
    role: "Conference Organiser"
  },
  {
    quote: "For member venues, a clearer discovery journey means stronger leads and less time spent qualifying incomplete enquiries.",
    name: "Mark Ellison",
    role: "Venue Sales Director"
  }
];

export const homepagePromoCards = [
  {
    title: "Join Stadium Experience",
    body:
      "If you represent a football, rugby or cricket club with established conference and events facilities, membership can help raise your profile with planners across the UK.",
    cta: "Join Stadium Experience",
    href: "/about/"
  },
  {
    title: "Promote Your Products & Services",
    body:
      "Connect with stadium venues, present at member meetings, advertise to decision makers or support the annual awards programme through supplier opportunities.",
    cta: "Suppliers",
    href: "/suppliers/"
  }
];

export const homepageTiles = [
  {
    title: "Join Stadium Experience",
    cta: "Click here",
    href: "/about/",
    icon: "/assets/stadium-experience/icon-member.png"
  },
  {
    title: "Stadium Events & Hospitality Awards",
    cta: "Click here",
    href: "/awards/",
    icon: "/assets/stadium-experience/icon-award.png"
  },
  {
    title: "Download Our Free Venue Guide",
    cta: "Click here",
    href: "/venues/",
    icon: "/assets/stadium-experience/icon-guide.png"
  }
];

export const whatsOnItems: EventItem[] = [
  {
    title: "Stadium Experience Industry Meetings",
    date: "May 2026",
    summary: "Network meetings for member venues and suppliers to share ideas, updates and commercial opportunities."
  },
  {
    title: "Awards Ticket Sales",
    date: "Autumn 2026",
    summary: "Ticket releases, accommodation details and key event dates for the annual awards programme."
  },
  {
    title: "Seasonal Venue Campaigns",
    date: "Year-round",
    summary: "Targeted campaigns around Christmas parties, summer events, meetings and large event spaces."
  }
];

export const jobListings: JobListing[] = [
  {
    slug: "conference-and-events-sales-manager-aberdeen-football-club",
    title: "Conference & Events Sales Manager",
    location: "Aberdeen Football Club",
    type: "Full-time",
    summary: "Lead venue sales activity across conferences, meetings and hospitality enquiries.",
    sections: [
      {
        heading: "Job role",
        body: [
          "Lead the venue sales pipeline across meetings, conferences, dinners and hospitality-led events.",
          "Work closely with venue colleagues to convert enquiries into confirmed business and support broader commercial targets."
        ]
      }
    ],
    salary: "Competitive",
    hours: "Full-time",
    jobLocation: "Aberdeen",
    closingDate: "31 May 2026",
    applicationUrl: null,
    contactEmail: "office@stadiumexperience.com"
  },
  {
    slug: "event-operations-coordinator-edgbaston",
    title: "Event Operations Coordinator",
    location: "Edgbaston",
    type: "Full-time",
    summary: "Support event delivery for business meetings, dinners and seasonal event programmes.",
    sections: [
      {
        heading: "Job responsibilities",
        body: [
          "Coordinate operational planning for conferences, meetings, private dining and seasonal event activity.",
          "Support venue teams with timelines, supplier coordination and smooth on-the-day delivery."
        ]
      }
    ],
    salary: "Competitive",
    hours: "40 hours per week",
    jobLocation: "Birmingham",
    closingDate: "14 June 2026",
    applicationUrl: null,
    contactEmail: "office@stadiumexperience.com"
  },
  {
    slug: "hospitality-and-matchday-sales-executive-chelsea-football-club",
    title: "Hospitality & Matchday Sales Executive",
    location: "Chelsea Football Club",
    type: "Full-time",
    summary: "Drive premium hospitality sales across corporate and private event products.",
    sections: [
      {
        heading: "Job role",
        body: [
          "Drive premium hospitality and matchday sales activity across corporate clients, private groups and event buyers.",
          "Build relationships, handle enquiries and help grow repeat business across the venue calendar."
        ]
      }
    ],
    salary: "Competitive",
    hours: "Full-time",
    jobLocation: "London",
    closingDate: "21 June 2026",
    applicationUrl: null,
    contactEmail: "office@stadiumexperience.com"
  }
];

export const venueGuideHighlights = [
  "A downloadable guide with venue capacities and direct contact details",
  "A useful planning shortcut for buyers comparing multiple stadium venues",
  "A strong lead-generation asset that should stay prominent across the site"
];

export const christmasPartyHighlights = [
  "Shared and exclusive festive party options at stadium venues across the UK",
  "A clear path for buyers choosing by region, guest count and style of event",
  "Dedicated seasonal landing pages that can be refreshed each year"
];

export const advertisingHighlights = [
  "Opportunities to reach stadium venue decision makers through meetings, awards and campaigns",
  "A clearer partner proposition with practical advertising and sponsorship routes",
  "Supplier pages that support enquiries instead of acting like static brochure copy"
];
