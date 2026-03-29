export type AwardsLink = {
  label: string;
  href: string;
  description?: string;
  external?: boolean;
};

export type AwardsStat = {
  label: string;
  value: string;
  detail?: string;
};

export type AwardsTimelineItem = {
  label: string;
  value: string;
  detail?: string;
};

export type AwardsSponsor = {
  name: string;
  href?: string;
  logoUrl?: string;
  description?: string;
  meta?: string;
};

export type AwardsFaqItem = {
  question: string;
  answer: string;
};

export type AwardsSectionBlock = {
  eyebrow?: string;
  heading: string;
  body: string[];
  items?: string[];
  imageUrl?: string;
  imageAlt?: string;
  tone?: "default" | "callout";
};

type AwardsBaseContent = {
  slug: string;
  heroEyebrow: string;
  title: string;
  summary: string;
  heroImageUrl?: string | null;
  heroLabel?: string | null;
  statusText?: string | null;
  intro: string[];
  highlights: string[];
  stats: AwardsStat[];
  timeline: AwardsTimelineItem[];
  ctaLinks: AwardsLink[];
  mediaLinks: AwardsLink[];
  sponsorsTitle?: string | null;
  sponsorsSummary?: string | null;
  sponsors: AwardsSponsor[];
  sections: AwardsSectionBlock[];
  archiveLinks: AwardsLink[];
  published?: boolean;
  sortOrder?: number;
};

export type AwardsPage = AwardsBaseContent & {
  pageType: "landing" | "standard" | "faq";
  programmeSlug?: string | null;
  faqItems: AwardsFaqItem[];
};

export type AwardsProgramme = AwardsBaseContent & {
  pageType: "programme";
  yearLabel: string;
  eventDateText?: string | null;
  venueName?: string | null;
  venueCity?: string | null;
  categoryIntroTitle?: string | null;
  categoryIntroSummary?: string | null;
};

export type AwardsCategory = {
  slug: string;
  programmeSlug: string;
  heroEyebrow: string;
  title: string;
  shortTitle: string;
  summary: string;
  heroImageUrl?: string | null;
  statusText?: string | null;
  eligibilityText?: string | null;
  openedText?: string | null;
  closesText?: string | null;
  sponsorName?: string | null;
  sponsorDescription?: string | null;
  sponsorUrl?: string | null;
  sponsorLogoUrl?: string | null;
  stats: AwardsStat[];
  timeline: AwardsTimelineItem[];
  criteriaIntro: string;
  criteriaPoints: string[];
  submissionText?: string | null;
  judgingText?: string | null;
  resultsText?: string | null;
  mediaLinks: AwardsLink[];
  ctaLinks: AwardsLink[];
  sections: AwardsSectionBlock[];
  published?: boolean;
  sortOrder?: number;
};

export const fallbackAwardsProgrammes: AwardsProgramme[] = [
  {
    slug: "2026-awards",
    pageType: "programme",
    yearLabel: "2026 Awards",
    heroEyebrow: "Stadium Events & Hospitality Awards",
    title: "The Stadium Events & Hospitality Awards 2026",
    summary:
      "A modern year hub for ticket sales, guest planning, category entries, sponsors and event-night logistics around the 19th annual awards.",
    heroImageUrl: "/assets/stadium-experience/hero-team-shot.jpg",
    heroLabel: "2026 programme hub",
    statusText: "Entries open",
    eventDateText: "Thursday 2 July 2026",
    venueName: "Hill Dickinson Stadium",
    venueCity: "Liverpool",
    intro: [
      "The Stadium Events & Hospitality Awards recognise the matchday hospitality and specialist events teams working across football, rugby and cricket venues in the UK stadium sector.",
      "The 2026 build is designed as a year-based content hub so tickets, categories, guest details, sponsors and archive content can all live in one reusable structure rather than being scattered across one-off pages."
    ],
    highlights: [
      "Ticketing, guest details and accommodation routes in one place",
      "Structured category pages with clear criteria and judging notes",
      "Sponsor visibility designed to work during the live campaign and as an archive afterwards"
    ],
    stats: [
      { label: "Annual event", value: "19th edition" },
      { label: "Expected guests", value: "500+" },
      { label: "Stadia represented", value: "70+" }
    ],
    timeline: [
      { label: "Entries open", value: "October 2025" },
      { label: "Guest details due", value: "18 May 2026" },
      { label: "Awards night", value: "2 July 2026", detail: "Hill Dickinson Stadium, Liverpool" }
    ],
    ctaLinks: [
      { label: "Book tickets", href: "/awards/book-tickets/" },
      { label: "View award categories", href: "/awards/award-categories/" },
      { label: "Ask about sponsorship", href: "/enquire/" }
    ],
    mediaLinks: [
      { label: "Awards accommodation", href: "/awards/accommodation/", description: "Hotel and stay planning for guests." },
      { label: "Independent judging", href: "/awards/independent-judging/", description: "How the programme is judged each year." },
      { label: "Awards FAQ", href: "/awards/frequently-asked-questions/", description: "Common questions on entries, judging and event planning." },
      { label: "Sponsorship opportunities", href: "/awards/award-sponsorship-opportunities/", description: "Commercial packages and partner visibility." }
    ],
    sponsorsTitle: "Selected 2026 partners",
    sponsorsSummary:
      "The live site uses sponsor-heavy layouts throughout the awards section, so the new model keeps sponsors as a reusable content collection rather than hardcoded logos in templates.",
    sponsors: [
      {
        name: "Global Payments",
        href: "https://www.globalpayments.com/",
        description: "Headline sponsor supporting the 2026 awards programme."
      },
      {
        name: "Everton FC",
        href: "https://www.evertonfc.com/",
        description: "Host venue partner for the 2026 awards at Hill Dickinson Stadium."
      },
      {
        name: "Tixserve",
        href: "https://www.tixserve.com/",
        description: "Digital ticketing and guest access partner."
      },
      {
        name: "GetPica",
        href: "https://www.getpica.com/",
        description: "Photography partner for event-night image sharing."
      }
    ],
    sections: [
      {
        eyebrow: "Event night",
        heading: "What guests can expect on the evening",
        body: [
          "The 2026 awards are positioned as a premium black-tie industry gathering with a drinks reception, gala dinner, awards ceremony, entertainment and after-party.",
          "This updated template keeps event-night expectations, guest logistics and booking routes close together so visitors do not have to piece the journey together from separate one-off pages."
        ],
        items: [
          "Drinks reception and networking on arrival",
          "Three-course banquet and formal awards ceremony",
          "Digital tickets and guest details managed ahead of the event"
        ]
      },
      {
        eyebrow: "Entries and judging",
        heading: "Built around reusable category content",
        body: [
          "Most categories are independently judged by industry experts, while specialist categories such as matchday hospitality and mystery shopper awards follow their own published route.",
          "The new architecture keeps category deadlines, eligibility notes and sponsor details editable per category while reusing the same layout year after year."
        ],
        tone: "callout"
      }
    ],
    archiveLinks: [
      { label: "2025 Awards archive", href: "/awards/2025-awards/" },
      { label: "Awards home", href: "/awards/" }
    ],
    categoryIntroTitle: "2026 award categories",
    categoryIntroSummary:
      "Each category page follows the same template so editors can publish judging notes, sponsor visibility, entry guidance and results in a consistent way.",
    published: true,
    sortOrder: 2026
  },
  {
    slug: "2025-awards",
    pageType: "programme",
    yearLabel: "2025 Awards",
    heroEyebrow: "Stadium Events & Hospitality Awards",
    title: "Awards 2025",
    summary:
      "A polished archive for the 18th annual awards at Brighton & Hove Albion FC, bringing together results, partners, photos and the event story.",
    heroImageUrl: "/assets/stadium-experience/headingley.jpg",
    heroLabel: "Archive year",
    statusText: "Results published",
    eventDateText: "Thursday 3 July 2025",
    venueName: "The American Express Stadium",
    venueCity: "Brighton",
    intro: [
      "The Stadium Events & Hospitality Awards 2025 recognised the commitment of matchday hospitality and specialist events teams from across the UK stadium network.",
      "Rather than leaving a previous year as a fading one-off page, the rebuilt version treats it as a proper archive that still supports sponsor exposure, future-year credibility and easy access to media links."
    ],
    highlights: [
      "Results, photos and sponsor links grouped together",
      "Archive design that still feels part of the main awards journey",
      "Easy year-on-year reuse for future editors"
    ],
    stats: [
      { label: "Edition", value: "18th annual event" },
      { label: "Host venue", value: "Brighton & Hove Albion FC" },
      { label: "Headline sponsor", value: "Global Payments" }
    ],
    timeline: [
      { label: "Awards night", value: "3 July 2025" },
      { label: "Results", value: "Published" },
      { label: "Photo access", value: "Available online" }
    ],
    ctaLinks: [
      { label: "View 2026 awards", href: "/awards/2026-awards/" },
      { label: "Awards FAQ", href: "/awards/frequently-asked-questions/" }
    ],
    mediaLinks: [
      { label: "Awards results", href: "https://stadiumexperience.com/awards/2025-awards/", description: "Legacy live-site results reference.", external: true },
      { label: "Access awards photos", href: "https://www.getpica.com/", description: "Official 2025 photo sharing partner.", external: true },
      { label: "Sponsors and suppliers contact list", href: "https://stadiumexperience.com/awards/2025-awards/", description: "Legacy contact list reference.", external: true }
    ],
    sponsorsTitle: "Selected 2025 sponsors",
    sponsorsSummary: "Representative sponsors migrated from the live awards archive.",
    sponsors: [
      { name: "Global Payments", href: "https://www.globalpayments.com/" },
      { name: "Brighton & Hove Albion FC", href: "https://www.brightonandhovealbion.com/" },
      { name: "Mascol", href: "https://www.mascol.com/" },
      { name: "Tixserve", href: "https://www.tixserve.com/" },
      { name: "iVvy", href: "https://www.ivvy.com/" },
      { name: "GetPica", href: "https://www.getpica.com/" }
    ],
    sections: [
      {
        eyebrow: "Archive value",
        heading: "Why a year archive still matters",
        body: [
          "Previous years help future attendees, sponsors and venues understand the scale, quality and credibility of the programme.",
          "This archive template keeps results and media visible without forcing editors to rebuild the layout each year from scratch."
        ]
      }
    ],
    archiveLinks: [
      { label: "2026 Awards", href: "/awards/2026-awards/" },
      { label: "Awards home", href: "/awards/" }
    ],
    categoryIntroTitle: "2025 coverage",
    categoryIntroSummary: "Older category pages can be linked in the same reusable grid when archive detail pages are migrated.",
    published: true,
    sortOrder: 2025
  }
];

export const fallbackAwardsPages: AwardsPage[] = [
  {
    slug: "awards",
    pageType: "landing",
    heroEyebrow: "Awards",
    title: "The Stadium Events & Hospitality Awards",
    summary:
      "A central awards destination for year hubs, categories, judging, guest planning and sponsorship, rebuilt as a maintainable content system rather than a one-page microsite.",
    heroImageUrl: "/assets/stadium-experience/hero-team-shot.jpg",
    heroLabel: "Awards home",
    statusText: "Annual programme",
    intro: [
      "The Stadium Events & Hospitality Awards were founded in 2005 to recognise the very best UK stadium hospitality and events teams.",
      "The new build preserves that structure and tone while making it easier to create future award years, update supporting information and manage archive content without hardcoded page-by-page edits."
    ],
    highlights: [
      "Dedicated templates for landing, year, info, FAQ and category pages",
      "Sponsor, CTA, media and archive sections managed as structured data",
      "A clearer content model for future award years"
    ],
    stats: [
      { label: "Founded", value: "2005" },
      { label: "Guests", value: "500+" },
      { label: "Stadia", value: "70+" }
    ],
    timeline: [
      { label: "Current live year", value: "2026 Awards" },
      { label: "Latest archive", value: "2025 Awards" },
      { label: "Programme scope", value: "Awards, judging, guests and sponsors" }
    ],
    ctaLinks: [
      { label: "View 2026 awards", href: "/awards/2026-awards/" },
      { label: "Book tickets", href: "/awards/book-tickets/" },
      { label: "Ask about the awards", href: "/enquire/" }
    ],
    mediaLinks: [
      { label: "Award categories", href: "/awards/award-categories/", description: "See the active award categories and entry routes." },
      { label: "Independent judging", href: "/awards/independent-judging/", description: "Understand how the programme is judged." },
      { label: "Awards accommodation", href: "/awards/accommodation/", description: "Help guests plan their stay around the event." },
      { label: "Sponsorship opportunities", href: "/awards/award-sponsorship-opportunities/", description: "Audience, packages and partner routes." }
    ],
    sponsorsTitle: "Programme partners",
    sponsorsSummary: "The landing page keeps partner visibility present without overwhelming the rest of the page architecture.",
    sponsors: [
      { name: "Global Payments", href: "https://www.globalpayments.com/" },
      { name: "Tixserve", href: "https://www.tixserve.com/" },
      { name: "GetPica", href: "https://www.getpica.com/" }
    ],
    sections: [
      {
        eyebrow: "What the awards recognise",
        heading: "An annual celebration with a practical planning journey",
        body: [
          "The live site mixes programme storytelling with ticketing, judging, FAQs, sponsors and archive links. The new structure keeps those journeys intact, but organises them into reusable page templates and smaller composable sections.",
          "That makes the section easier for non-technical editors to maintain while keeping the public experience consistent from year to year."
        ]
      },
      {
        eyebrow: "Migration approach",
        heading: "Designed for future years, not just this rebuild",
        body: [
          "New years can be created from the same template and connected to their own categories, media links and sponsor collections.",
          "Supporting pages such as FAQs, judging and accommodation remain standalone pages, but now share the same content blocks, CTAs and visual system."
        ],
        tone: "callout"
      }
    ],
    faqItems: [],
    archiveLinks: [
      { label: "2026 Awards", href: "/awards/2026-awards/" },
      { label: "2025 Awards", href: "/awards/2025-awards/" }
    ],
    published: true,
    sortOrder: 2000
  },
  {
    slug: "book-tickets",
    pageType: "standard",
    programmeSlug: "2026-awards",
    heroEyebrow: "Awards tickets",
    title: "Book tickets for the 2026 awards",
    summary:
      "A clear ticketing page for member and non-member bookings, guest detail collection and event-night logistics.",
    heroImageUrl: "/assets/stadium-experience/hero-team-shot.jpg",
    heroLabel: "Ticketing and guest details",
    statusText: "Booking live",
    intro: [
      "The live site combines ticket purchasing, member offers, guest detail collection and accommodation links on the booking journey.",
      "In the new model, ticket details are stored as structured sections so pricing, deadlines and guest instructions can be updated without touching layout code."
    ],
    highlights: [
      "Member and non-member pricing kept in one editable place",
      "Guest detail deadlines clearly separated from booking copy",
      "Straight route through to support and accommodation"
    ],
    stats: [
      { label: "Member ticket", value: "GBP130 + VAT" },
      { label: "Non-member ticket", value: "GBP199 + VAT" },
      { label: "Table size", value: "Up to 10 guests" }
    ],
    timeline: [
      { label: "Tickets on sale", value: "Now" },
      { label: "Guest details due", value: "18 May 2026" },
      { label: "Awards night", value: "2 July 2026" }
    ],
    ctaLinks: [
      { label: "Ask about tickets", href: "/enquire/" },
      { label: "View 2026 awards", href: "/awards/2026-awards/" }
    ],
    mediaLinks: [
      { label: "Awards accommodation", href: "/awards/accommodation/" },
      { label: "Awards FAQ", href: "/awards/frequently-asked-questions/" }
    ],
    sponsorsTitle: null,
    sponsorsSummary: null,
    sponsors: [],
    sections: [
      {
        eyebrow: "Member rate and priority access",
        heading: "Member venues receive the clearest value story",
        body: [
          "Member venues receive discounted ticket rates and early access, with the live programme also promoting a two-free-tickets offer when annual membership is paid on time.",
          "Treating this as structured content means the offer wording and deadlines can be adjusted year by year without rebuilding the page."
        ],
        items: [
          "Individual member ticket: GBP130 + VAT",
          "Table of 10: GBP1,040 + VAT",
          "Two free ticket offer tied to annual membership terms"
        ]
      },
      {
        eyebrow: "Non-member rate and payment terms",
        heading: "Support both audience types cleanly",
        body: [
          "Non-member pricing and payment terms should remain prominent, particularly when late-year campaigns focus on suppliers or partner guests joining the awards night.",
          "The public template supports short sections like this without needing long, unstructured copy blocks."
        ],
        items: [
          "Individual non-member ticket: GBP199 + VAT",
          "Table of 10: GBP1,990 + VAT",
          "Payments made in advance by bank transfer"
        ]
      },
      {
        eyebrow: "Receiving tickets and guest details",
        heading: "Guest information can be updated separately from pricing",
        body: [
          "After booking, lead bookers can be asked to provide guest names, dietary requirements, email addresses and mobile numbers so digital tickets can be issued closer to the event.",
          "This content is often date-sensitive, so it benefits from living in its own editable section rather than inside a single hardcoded ticketing page."
        ]
      }
    ],
    faqItems: [],
    archiveLinks: [{ label: "2026 Awards", href: "/awards/2026-awards/" }],
    published: true,
    sortOrder: 180
  },
  {
    slug: "accommodation",
    pageType: "standard",
    programmeSlug: "2026-awards",
    heroEyebrow: "Awards accommodation",
    title: "Plan your awards-night stay",
    summary:
      "Keep hotel options, stay planning and travel reminders in a dedicated page that can be updated independently of ticketing or event copy.",
    heroImageUrl: "/assets/stadium-experience/headingley.jpg",
    heroLabel: "Guest stay planning",
    statusText: "Planning support",
    intro: [
      "Accommodation is a recurring awards support page and works best as a separate editable page rather than a short paragraph hidden inside the main event hub.",
      "This also gives editors a clean place to update room blocks, nearby hotel links and booking reminders as venue partners change from year to year."
    ],
    highlights: [
      "Useful before and after guests book tickets",
      "Easy to update when venue cities change each year",
      "Supports practical event planning without bloating the year page"
    ],
    stats: [
      { label: "Use case", value: "Guests and partners" },
      { label: "Timing", value: "Pre-event planning" },
      { label: "Managed as", value: "Reusable info page" }
    ],
    timeline: [
      { label: "Best time to book", value: "As early as possible" },
      { label: "City", value: "Liverpool" },
      { label: "Related page", value: "Book tickets" }
    ],
    ctaLinks: [
      { label: "Ask about accommodation", href: "/enquire/" },
      { label: "Book tickets", href: "/awards/book-tickets/" }
    ],
    mediaLinks: [
      { label: "View 2026 awards", href: "/awards/2026-awards/" },
      { label: "Awards FAQ", href: "/awards/frequently-asked-questions/" }
    ],
    sponsorsTitle: null,
    sponsorsSummary: null,
    sponsors: [],
    sections: [
      {
        eyebrow: "Stay planning",
        heading: "Use a dedicated page for hotel and travel guidance",
        body: [
          "The accommodation page is intentionally practical. It should help guests find options, understand booking windows and connect back to tickets or event-night information quickly.",
          "This is the kind of page editors are likely to revisit close to the event, which is why it benefits from its own reusable template."
        ],
        items: [
          "Feature nearby hotels or partner room blocks",
          "Add parking or local travel notes where relevant",
          "Link back to ticketing, guest details and FAQs"
        ]
      }
    ],
    faqItems: [],
    archiveLinks: [{ label: "2026 Awards", href: "/awards/2026-awards/" }],
    published: true,
    sortOrder: 170
  },
  {
    slug: "award-categories",
    pageType: "standard",
    programmeSlug: "2026-awards",
    heroEyebrow: "Award categories",
    title: "Explore the 2026 award categories",
    summary:
      "A reusable directory page that introduces the category structure and links editors and visitors into the current live category pages.",
    heroImageUrl: "/assets/stadium-experience/hero-team-shot.jpg",
    heroLabel: "Category directory",
    statusText: "Current categories",
    intro: [
      "The live site exposes categories through a mixture of year pages, sponsor pages and individual category detail pages.",
      "This directory template gives the section a clearer entry point and makes it easier to surface the current year's categories without hardcoding them into several places."
    ],
    highlights: [
      "Category cards are driven by the active programme",
      "Each category keeps its own sponsor, judging and criteria content",
      "Editors can add or retire categories without changing page templates"
    ],
    stats: [
      { label: "Linked year", value: "2026 Awards" },
      { label: "Editing model", value: "Category templates" },
      { label: "Public view", value: "Scannable directory" }
    ],
    timeline: [
      { label: "Entry cycle", value: "Autumn to spring" },
      { label: "Judging", value: "Independent or specialist routes" },
      { label: "Results", value: "Presented on awards night" }
    ],
    ctaLinks: [
      { label: "View 2026 awards", href: "/awards/2026-awards/" },
      { label: "Ask about entering", href: "/enquire/" }
    ],
    mediaLinks: [
      { label: "Independent judging", href: "/awards/independent-judging/" },
      { label: "Awards FAQ", href: "/awards/frequently-asked-questions/" }
    ],
    sponsorsTitle: null,
    sponsorsSummary: null,
    sponsors: [],
    sections: [
      {
        eyebrow: "Reusable category pages",
        heading: "Every category can follow the same shape",
        body: [
          "Categories typically repeat the same content pattern: status, eligibility, sponsor, criteria, submission route, judging notes and results.",
          "By turning that pattern into a template, the site becomes easier to scale and significantly easier for non-technical editors to maintain."
        ]
      }
    ],
    faqItems: [],
    archiveLinks: [{ label: "2026 Awards", href: "/awards/2026-awards/" }],
    published: true,
    sortOrder: 160
  },
  {
    slug: "independent-judging",
    pageType: "standard",
    programmeSlug: "2026-awards",
    heroEyebrow: "Independent judging",
    title: "Independent judging across the awards programme",
    summary:
      "A dedicated explanation of how categories are selected and judged, using structured content that can be updated cleanly each year.",
    heroImageUrl: "/assets/stadium-experience/headingley.jpg",
    heroLabel: "Judging process",
    statusText: "Programme guidance",
    intro: [
      "The live site explains that the awards are designed to drive standards upward and recognise the best venues across the stadium sector, with most categories judged independently.",
      "This page keeps that important credibility story visible and editable, which is especially helpful if judges, partners or category routes change from year to year."
    ],
    highlights: [
      "Explains both standard panel judging and specialist routes",
      "Supports transparency and trust for entrants",
      "Can feature judging partners, panels or biographies over time"
    ],
    stats: [
      { label: "Audience", value: "Entrants and sponsors" },
      { label: "Purpose", value: "Transparency" },
      { label: "Format", value: "Evergreen support page" }
    ],
    timeline: [
      { label: "Categories selected", value: "Each year" },
      { label: "Judging approach", value: "Independent or specialist" },
      { label: "Results", value: "Announced on awards night" }
    ],
    ctaLinks: [
      { label: "View categories", href: "/awards/award-categories/" },
      { label: "Ask about the process", href: "/enquire/" }
    ],
    mediaLinks: [
      { label: "Awards FAQ", href: "/awards/frequently-asked-questions/" },
      { label: "2026 awards", href: "/awards/2026-awards/" }
    ],
    sponsorsTitle: "Representative judging partners",
    sponsorsSummary: "The live judging page references external judging and industry partners. These are stored as editable sponsor-style cards here.",
    sponsors: [
      { name: "beam", href: "https://beam-org.uk/" },
      { name: "British Culinary Federation", href: "https://www.britishculinaryfederation.com/" },
      { name: "Greengage Solutions", href: "https://www.greengage.solutions/" },
      { name: "The Delegate Wranglers", href: "https://thedelegatewranglers.com/" },
      { name: "Venue Directory", href: "https://www.venuedirectory.com/" }
    ],
    sections: [
      {
        eyebrow: "Award categories",
        heading: "Category selection starts with relevance",
        body: [
          "The Stadium Experience leadership team reviews categories each year using member feedback and wider industry developments to make sure the programme still reflects how stadium venues operate.",
          "That makes the supporting judging page a useful editorial surface, not just a compliance note."
        ]
      },
      {
        eyebrow: "How judging works",
        heading: "Not every category follows the same route",
        body: [
          "Most categories are judged by independent experts, while specialist awards such as matchday hospitality, chef team, mystery shopper and visiting directors use a dedicated process.",
          "The rebuilt template makes those distinctions easier to explain and easier to update."
        ],
        items: [
          "Panel-scored written entry categories",
          "Visited or mystery-shopper style categories",
          "Specialist voting routes such as event agents or visiting directors"
        ],
        tone: "callout"
      }
    ],
    faqItems: [],
    archiveLinks: [{ label: "View categories", href: "/awards/award-categories/" }],
    published: true,
    sortOrder: 150
  },
  {
    slug: "frequently-asked-questions",
    pageType: "faq",
    programmeSlug: "2026-awards",
    heroEyebrow: "Awards FAQ",
    title: "Frequently asked questions",
    summary:
      "A structured FAQ page covering categories, judging and event details, built so editors can update answers without touching the template.",
    heroImageUrl: "/assets/stadium-experience/hero-team-shot.jpg",
    heroLabel: "FAQ hub",
    statusText: "Practical guidance",
    intro: [
      "The live FAQ page brings together the most common questions on category selection, deadlines, eligibility and event planning.",
      "In the new build, those answers live as structured FAQ items, which makes them much easier to maintain and reorder."
    ],
    highlights: [
      "Scannable answer structure rather than one large page of copy",
      "Useful for entrants, guests and sponsors",
      "Easy for editors to keep fresh close to launch deadlines"
    ],
    stats: [
      { label: "Best for", value: "Common questions" },
      { label: "Content style", value: "Structured answers" },
      { label: "Updated by", value: "Non-technical editors" }
    ],
    timeline: [
      { label: "Questions evolve", value: "Throughout the campaign" },
      { label: "Entry window", value: "Autumn to spring" },
      { label: "Event support", value: "Pre-event planning" }
    ],
    ctaLinks: [
      { label: "View 2026 awards", href: "/awards/2026-awards/" },
      { label: "Ask a question", href: "/enquire/" }
    ],
    mediaLinks: [
      { label: "Book tickets", href: "/awards/book-tickets/" },
      { label: "Independent judging", href: "/awards/independent-judging/" }
    ],
    sponsorsTitle: null,
    sponsorsSummary: null,
    sponsors: [],
    sections: [
      {
        eyebrow: "Before you enter or attend",
        heading: "Keep the answers clear and current",
        body: [
          "The FAQ is most useful when it stays tightly edited and easy to scan. Editors should be able to update dates, category guidance and guest reminders without needing a developer.",
          "That is why the page template treats FAQs as a first-class content type rather than a one-off body field."
        ]
      }
    ],
    faqItems: [
      {
        question: "How is awards feedback used?",
        answer:
          "Feedback on categories, judging and the event itself is reviewed each year so the programme can continue to improve and reflect current stadium-sector priorities."
      },
      {
        question: "How are the categories selected?",
        answer:
          "The Stadium Experience leadership team reviews the categories each year using feedback from member venues alongside wider industry developments."
      },
      {
        question: "When do the awards open for entry?",
        answer:
          "Most categories typically open in autumn and close in late March or early April, while specialist awards such as chef team and matchday hospitality follow their own timetable."
      },
      {
        question: "What is the entry deadline?",
        answer:
          "Most awards stay open for around six months. The exact closing date should always be shown on the relevant category page for the active awards year."
      },
      {
        question: "Can all UK clubs enter every award?",
        answer:
          "No. Some categories are open only to Stadium Experience member venues, while others are open more widely. Eligibility should always be shown clearly on the category page."
      },
      {
        question: "Can venues with multiple clubs enter more than once?",
        answer:
          "A venue may use one of its clubs for one category and another club for a different category, depending on the award rules for that year."
      }
    ],
    archiveLinks: [{ label: "2026 Awards", href: "/awards/2026-awards/" }],
    published: true,
    sortOrder: 140
  },
  {
    slug: "award-sponsorship-opportunities",
    pageType: "standard",
    programmeSlug: "2026-awards",
    heroEyebrow: "Awards sponsorship",
    title: "Award sponsorship opportunities",
    summary:
      "A sponsor-ready commercial page that explains the audience, packages and partner visibility available around the awards programme.",
    heroImageUrl: "/assets/stadium-experience/headingley.jpg",
    heroLabel: "Commercial opportunities",
    statusText: "Commercial page",
    intro: [
      "The live sponsorship page positions the awards as an opportunity to raise brand profile with senior decision makers from football, rugby and cricket stadia across the UK.",
      "In the new build, that message becomes a reusable commercial template that can be refreshed every year without redesigning the page."
    ],
    highlights: [
      "Sponsor visibility across landing, year and category pages",
      "Useful for inbound sales conversations and follow-up links",
      "Works both during the live cycle and as a post-event archive"
    ],
    stats: [
      { label: "Decision makers", value: "450+" },
      { label: "Venues", value: "70+" },
      { label: "Format", value: "Live and archive exposure" }
    ],
    timeline: [
      { label: "Campaign planning", value: "Before entries and ticket push" },
      { label: "Event exposure", value: "Awards night" },
      { label: "Archive value", value: "Year-round credibility" }
    ],
    ctaLinks: [
      { label: "Register sponsorship interest", href: "/enquire/" },
      { label: "View 2026 awards", href: "/awards/2026-awards/" }
    ],
    mediaLinks: [
      { label: "Independent judging", href: "/awards/independent-judging/" },
      { label: "2025 archive", href: "/awards/2025-awards/" }
    ],
    sponsorsTitle: "Representative sponsored categories",
    sponsorsSummary: "These sample category sponsors mirror the sponsor-led structure visible on the live site and can be edited year by year.",
    sponsors: [
      { name: "Braehead Foods", href: "https://www.braeheadfoods.co.uk/", description: "Operations Team of the Year Award" },
      { name: "Rational UK", href: "https://www.rational-online.com/", description: "Stadium Event of the Year Award" },
      { name: "Chef Works", href: "https://chefworks.co.uk/", description: "Chef Team of the Year Award" },
      { name: "Hobart UK", href: "https://www.hobartuk.com/", description: "Matchday Sales and Marketing Team of the Year Award" }
    ],
    sections: [
      {
        eyebrow: "Why partners engage",
        heading: "The awards are a relationship-led industry platform",
        body: [
          "Partners are buying more than logo placement. They are buying relevance with venue leaders, hospitality teams and stadium-sector suppliers in a setting that already carries strong industry trust.",
          "That is why sponsor content should be structured and reusable across the section rather than buried in one isolated page."
        ]
      },
      {
        eyebrow: "Package structure",
        heading: "A cleaner way to maintain sponsor inventory",
        body: [
          "Editors can manage sold packages, category sponsors, links and brand copy directly from the admin area.",
          "This keeps the commercial story current without forcing every sponsor change through a manual page rebuild."
        ],
        items: [
          "Headline or programme-level partner positions",
          "Individual category sponsorship",
          "Archive visibility for post-event credibility"
        ],
        tone: "callout"
      }
    ],
    faqItems: [],
    archiveLinks: [
      { label: "2026 Awards", href: "/awards/2026-awards/" },
      { label: "2025 archive", href: "/awards/2025-awards/" }
    ],
    published: true,
    sortOrder: 130
  }
];

export const fallbackAwardsCategories: AwardsCategory[] = [
  {
    slug: "event-agents-choice-award",
    programmeSlug: "2026-awards",
    heroEyebrow: "2026 award category",
    title: "Event Agents Choice Award",
    shortTitle: "Agents Choice",
    summary:
      "A category voted for by event agents based on the quality of the enquiry experience they received from stadium venues.",
    heroImageUrl: "/assets/stadium-experience/hero-team-shot.jpg",
    statusText: "Open for votes",
    eligibilityText: "All UK stadium venues can be nominated",
    openedText: "Opened October 2025",
    closesText: "Closes Friday 27 March 2026",
    sponsorName: "Global Payments",
    sponsorDescription: "Representative sponsor shown here as a reusable editable field.",
    sponsorUrl: "https://www.globalpayments.com/",
    stats: [
      { label: "Entry route", value: "Agent vote" },
      { label: "Eligibility", value: "All UK stadium venues" },
      { label: "Awarded", value: "Gold, silver and bronze" }
    ],
    timeline: [
      { label: "Opened", value: "October 2025" },
      { label: "Voting closes", value: "27 March 2026" },
      { label: "Presented", value: "2 July 2026" }
    ],
    criteriaIntro:
      "This category focuses on the enquiry journey and asks event agents to vote for the venue that delivered the best response, support and planning experience.",
    criteriaPoints: [
      "Votes can only be placed by event agents who submitted a non-matchday enquiry during the relevant judging period.",
      "The event agent is asked to assess responsiveness, planning support and overall service throughout the enquiry process.",
      "The event itself may take place later. The judging focus is the enquiry experience rather than the eventual event delivery."
    ],
    submissionText: "Eligible event agents place their vote using the entry form for the current awards year.",
    judgingText: "Only event agents are eligible to vote, and each agent is asked to vote once.",
    resultsText: "Gold, silver and bronze placements are announced on the awards night.",
    mediaLinks: [{ label: "Independent judging", href: "/awards/independent-judging/" }],
    ctaLinks: [
      { label: "Ask about nominations", href: "/enquire/" },
      { label: "View 2026 awards", href: "/awards/2026-awards/" }
    ],
    sections: [
      {
        eyebrow: "How to use this page",
        heading: "A category template that works for specialist voting routes",
        body: [
          "Not every category uses the same judging method, so the page template needs enough flexibility to explain variations without losing consistency.",
          "This page shows how specialist routes can still use the same hero, facts, criteria and CTA structure as panel-judged categories."
        ]
      }
    ],
    published: true,
    sortOrder: 10
  },
  {
    slug: "operations-team-of-the-year-award",
    programmeSlug: "2026-awards",
    heroEyebrow: "2026 award category",
    title: "Operations Team of the Year Award",
    shortTitle: "Operations Team",
    summary:
      "Recognises teams that deliver outstanding operational performance across matchday and non-matchday stadium events.",
    heroImageUrl: "/assets/stadium-experience/headingley.jpg",
    statusText: "Open for entry",
    eligibilityText: "Available to Stadium Experience member venues only",
    openedText: "Opened October 2025",
    closesText: "Closes Friday 27 March 2026",
    sponsorName: "Braehead Foods",
    sponsorDescription: "Sponsor of the Operations Team of the Year Award.",
    sponsorUrl: "https://www.braeheadfoods.co.uk/",
    stats: [
      { label: "Entry route", value: "Written submission" },
      { label: "Eligibility", value: "Member venues only" },
      { label: "Judging", value: "Independent industry panel" }
    ],
    timeline: [
      { label: "Opened", value: "October 2025" },
      { label: "Closing date", value: "27 March 2026" },
      { label: "Results", value: "2 July 2026" }
    ],
    criteriaIntro:
      "This category looks for clear evidence that the operations team has delivered strong service, logistics and event performance across the season.",
    criteriaPoints: [
      "Show how the team supported smooth delivery across matchday or non-matchday events.",
      "Include evidence such as customer feedback, operational improvements or measurable outcomes.",
      "Keep the main submission concise and focused on the strongest examples."
    ],
    submissionText: "Complete the entry form and provide supporting evidence before the closing date.",
    judgingText: "Entries are reviewed independently and scored using a ranked judging process.",
    resultsText: "Winner, silver and bronze placements are announced during the awards evening.",
    mediaLinks: [
      { label: "Sponsorship opportunities", href: "/awards/award-sponsorship-opportunities/" },
      { label: "Independent judging", href: "/awards/independent-judging/" }
    ],
    ctaLinks: [
      { label: "Ask about entering", href: "/enquire/" },
      { label: "View categories", href: "/awards/award-categories/" }
    ],
    sections: [
      {
        eyebrow: "Entry guidance",
        heading: "Keep the category page focused on what judges need",
        body: [
          "This template makes it easier to separate the broad category story from the practical entry detail, which helps both entrants and editors.",
          "Editors can update sponsor attribution, timings and criteria each year without rewriting the layout."
        ]
      }
    ],
    published: true,
    sortOrder: 20
  },
  {
    slug: "chef-team-of-the-year-award",
    programmeSlug: "2026-awards",
    heroEyebrow: "2026 award category",
    title: "Chef Team of the Year Award",
    shortTitle: "Chef Team",
    summary:
      "Celebrates culinary teams delivering quality, creativity and consistency in a live judged format.",
    heroImageUrl: "/assets/stadium-experience/hero-team-shot.jpg",
    statusText: "Specialist entry route",
    eligibilityText: "Stadium Experience member venues",
    openedText: "Opened July 2025",
    closesText: "Live judging schedule applies",
    sponsorName: "Chef Works",
    sponsorDescription: "Representative sponsor for the live kitchen competition format.",
    sponsorUrl: "https://chefworks.co.uk/",
    stats: [
      { label: "Entry route", value: "Live judged event" },
      { label: "Format", value: "Kitchen competition" },
      { label: "Availability", value: "Limited places" }
    ],
    timeline: [
      { label: "Opens", value: "July 2025" },
      { label: "Live event", value: "Spring 2026" },
      { label: "Presented", value: "2 July 2026" }
    ],
    criteriaIntro:
      "This category uses a live practical format and rewards chef teams that demonstrate technical skill, planning and delivery under judged conditions.",
    criteriaPoints: [
      "Teams should prepare for a live judged kitchen or showcase format.",
      "Judges assess quality, presentation, teamwork and consistency.",
      "Places may be limited, so entry timing matters more than on written-submission categories."
    ],
    submissionText: "Register interest early because live judged places are limited.",
    judgingText: "This category is judged through a specialist live process rather than a standard written-entry panel review.",
    resultsText: "The outcome feeds into the awards programme and is celebrated during the main event.",
    mediaLinks: [{ label: "Awards FAQ", href: "/awards/frequently-asked-questions/" }],
    ctaLinks: [
      { label: "Ask about chef team entry", href: "/enquire/" },
      { label: "View 2026 awards", href: "/awards/2026-awards/" }
    ],
    sections: [
      {
        eyebrow: "Specialist category",
        heading: "This shows why category templates need flexibility",
        body: [
          "Some awards rely on live or visited judging rather than a standard document submission. The category model needs to handle those differences cleanly.",
          "This is a good example of why a schema-driven build is more maintainable than hardcoding each category page separately."
        ]
      }
    ],
    published: true,
    sortOrder: 30
  },
  {
    slug: "overall-matchday-hospitality-award",
    programmeSlug: "2026-awards",
    heroEyebrow: "2026 award category",
    title: "Overall Matchday Hospitality Award",
    shortTitle: "Overall Matchday Hospitality",
    summary:
      "A best-of-the-best award determined from the results across the matchday hospitality size categories.",
    heroImageUrl: "/assets/stadium-experience/headingley.jpg",
    statusText: "Opening soon",
    eligibilityText: "Available to Stadium Experience member venues only",
    openedText: "Opens with matchday hospitality entries",
    closesText: "Fixture must be held by Sunday 25 April 2026",
    sponsorName: "Global Payments",
    sponsorDescription: "Representative headline sponsor placement.",
    sponsorUrl: "https://www.globalpayments.com/",
    stats: [
      { label: "Entry route", value: "Automatic through hospitality awards" },
      { label: "Judging", value: "Live visit and scoring" },
      { label: "Cost", value: "Free entry" }
    ],
    timeline: [
      { label: "Opening status", value: "Soon" },
      { label: "Fixture deadline", value: "25 April 2026" },
      { label: "Presented", value: "2 July 2026" }
    ],
    criteriaIntro:
      "This overall category is determined from the total scores across the small, medium and large matchday hospitality awards, identifying the strongest overall performance.",
    criteriaPoints: [
      "Venues do not submit a separate entry for this award.",
      "Eligibility is automatic through the matchday hospitality judging process.",
      "Scores across the three size categories determine the final overall positions."
    ],
    submissionText: "No separate submission is required once a venue is part of the matchday hospitality judging route.",
    judgingText: "An allocated judge and guest visit the stadium and assess the hospitality experience using the published criteria.",
    resultsText: "Bronze, silver and winner placements are announced at the 2026 awards evening.",
    mediaLinks: [{ label: "Independent judging", href: "/awards/independent-judging/" }],
    ctaLinks: [
      { label: "View 2026 awards", href: "/awards/2026-awards/" },
      { label: "Ask about matchday categories", href: "/enquire/" }
    ],
    sections: [
      {
        eyebrow: "Hospitality route",
        heading: "Specialist judging content belongs in the category layer",
        body: [
          "The live site includes judge biographies and specialist instructions for categories like this. The rebuilt version keeps the page flexible enough for that style of content, while preserving the same visual structure as the other categories."
        ]
      }
    ],
    published: true,
    sortOrder: 40
  },
  {
    slug: "stadium-event-of-the-year-award",
    programmeSlug: "2026-awards",
    heroEyebrow: "2026 award category",
    title: "Stadium Event of the Year Award",
    shortTitle: "Stadium Event",
    summary:
      "Recognises standout stadium-hosted events with clear evidence of planning, creativity, delivery and impact.",
    heroImageUrl: "/assets/stadium-experience/hero-team-shot.jpg",
    statusText: "Open for entry",
    eligibilityText: "Open to member venues",
    openedText: "Opened October 2025",
    closesText: "Closes Friday 27 March 2026",
    sponsorName: "Rational UK",
    sponsorDescription: "Sponsor supporting the Stadium Event of the Year Award.",
    sponsorUrl: "https://www.rational-online.com/",
    stats: [
      { label: "Entry route", value: "Written submission" },
      { label: "Focus", value: "Planning, creativity and outcomes" },
      { label: "Judging", value: "Independent panel" }
    ],
    timeline: [
      { label: "Opened", value: "October 2025" },
      { label: "Closing date", value: "27 March 2026" },
      { label: "Presented", value: "2 July 2026" }
    ],
    criteriaIntro:
      "This category rewards events that show strong creative thinking, commercial or audience impact and excellent stadium delivery.",
    criteriaPoints: [
      "Describe the event objective, audience and event concept clearly.",
      "Show how the venue delivered the event operationally and commercially.",
      "Include evidence of impact such as client feedback, attendance, press coverage or revenue."
    ],
    submissionText: "Entries should focus on one event and include the clearest supporting evidence available.",
    judgingText: "The judging panel scores the entry against creativity, execution and measurable success.",
    resultsText: "Results are revealed on the awards night as part of the main ceremony.",
    mediaLinks: [{ label: "Sponsorship opportunities", href: "/awards/award-sponsorship-opportunities/" }],
    ctaLinks: [
      { label: "Ask about entering", href: "/enquire/" },
      { label: "View categories", href: "/awards/award-categories/" }
    ],
    sections: [
      {
        eyebrow: "Category fit",
        heading: "A strong example of reusable evidence-led content",
        body: [
          "Pages like this benefit from a structured layout because editors repeatedly need to update sponsor, timing, criteria and submission wording while keeping the public presentation consistent."
        ]
      }
    ],
    published: true,
    sortOrder: 50
  }
];
