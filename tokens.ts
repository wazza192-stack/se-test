export const stadiumExperienceTokens = {
  color: {
    bg: "#eef1ea",
    bgDeep: "#dde4d7",
    surface: "rgba(255, 255, 255, 0.9)",
    surfaceStrong: "#ffffff",
    surfaceSoft: "#f5f7f1",
    surfaceTint: "#ebf0e5",
    text: "#172118",
    textMuted: "#596355",
    textMutedStrong: "#465044",
    line: "rgba(24, 33, 24, 0.1)",
    lineStrong: "rgba(24, 33, 24, 0.18)",
    brand: "#97b81b",
    brandStrong: "#7d9715",
    brandDeep: "#3d4f0d",
    accent: "#123c33",
    accentSoft: "#e3ece8"
  },
  shadow: {
    soft: "0 18px 40px rgba(18, 29, 18, 0.08)",
    rich: "0 28px 70px rgba(14, 24, 14, 0.14)",
    button: "0 16px 28px rgba(125, 151, 21, 0.24)"
  },
  radius: {
    card: "18px",
    panel: "30px",
    pill: "999px",
    input: "16px"
  },
  gradient: {
    brand: "linear-gradient(135deg, #97b81b 0%, #7d9715 100%)",
    surface: "linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(243, 246, 239, 0.92))",
    shell:
      "radial-gradient(circle at top left, rgba(151, 184, 27, 0.18), transparent 24%), radial-gradient(circle at top right, rgba(18, 60, 51, 0.16), transparent 28%), linear-gradient(180deg, #f6f8f4 0%, #eef2eb 340px, #f5f6f2 340px, #f8f8f5 100%)"
  },
  layout: {
    contentWidth: "1200px"
  },
  typography: {
    headingFamily: '"adobe-caslon-pro", Georgia, serif',
    bodyFamily: '"neo-sans", "Helvetica Neue", Arial, sans-serif',
    kickerSize: "0.74rem",
    kickerLetterSpacing: "0.14em"
  },
  component: {
    buttonMinHeight: "48px",
    inputMinHeight: "50px",
    tagPadding: "9px 12px",
    buttonPadding: "0 20px"
  }
} as const;

export type StadiumExperienceTokens = typeof stadiumExperienceTokens;
