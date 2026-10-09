/**
 * Shared icon registry. Pure TypeScript (no .astro imports) so it can be used
 * from components, from client scripts and from unit tests.
 */

export interface SvgIcon {
  title: string;
  viewBox: string;
  /** The `d` attribute of each `<path>`; every path uses fill="currentColor". */
  paths: readonly string[];
}

export const SOCIAL_NETWORKS = ["GitHub", "LinkedIn", "X"] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];

export const SOCIAL_ICONS: Readonly<Record<SocialNetwork, SvgIcon>> = {
  GitHub: {
    title: "GitHub",
    viewBox: "0 0 24 24",
    paths: [
      "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12",
    ],
  },
  LinkedIn: {
    title: "LinkedIn",
    viewBox: "0 0 24 24",
    paths: [
      "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
    ],
  },
  X: {
    title: "X",
    viewBox: "0 0 24 24",
    paths: [
      "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z",
    ],
  },
};

/** Generic link icon shown for networks that are not in the registry. */
export const FALLBACK_SOCIAL_ICON: SvgIcon = {
  title: "Link",
  viewBox: "0 0 24 24",
  paths: [
    "M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z",
  ],
};

export function isKnownNetwork(network: string): network is SocialNetwork {
  return (SOCIAL_NETWORKS as readonly string[]).includes(network);
}

/**
 * Resolves the icon of a network by exact name. Never returns undefined:
 * unknown networks get the fallback icon titled with the network name.
 */
export function getSocialIcon(network: string): SvgIcon {
  if (isKnownNetwork(network)) return SOCIAL_ICONS[network];
  return { ...FALLBACK_SOCIAL_ICON, title: network };
}

export interface RenderSvgOptions {
  size?: number;
  style?: string;
}

const HTML_ESCAPES: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

/** Serializes an icon to SVG markup. Title and style are HTML-escaped. */
export function renderSvg(
  icon: SvgIcon,
  { size = 16, style }: RenderSvgOptions = {},
): string {
  const styleAttr = style === undefined ? "" : ` style="${escapeHtml(style)}"`;
  const paths = icon.paths
    .map((d) => `<path fill="currentColor" d="${d}"></path>`)
    .join("");

  return (
    `<svg width="${size}" height="${size}" viewBox="${icon.viewBox}" ` +
    `xmlns="http://www.w3.org/2000/svg"${styleAttr}>` +
    `<title>${escapeHtml(icon.title)}</title>${paths}</svg>`
  );
}

export const SKILL_ICON_KEYS = [
  "HTML",
  "CSS",
  "JavaScript",
  "TypeScript",
  "React",
  "Node",
  "MySQL",
  "Git",
  "GitHub",
  "Tailwind",
  "AstroBuild",
  "Oracle",
  "Latex",
  // Kept on purpose (decision Q7): no skill in cv.json resolves to these today.
  "Next",
  "Swift",
  "SwiftUI",
  "Kotlin",
  "Flutter",
] as const;
export type SkillIconKey = (typeof SKILL_ICON_KEYS)[number];

const SKILL_ALIASES: Readonly<Record<string, SkillIconKey>> = {
  "Next.js": "Next",
  Astro: "AstroBuild",
  "PL/SQL": "Oracle",
  LaTeX: "Latex",
};

function isSkillIconKey(name: string): name is SkillIconKey {
  return (SKILL_ICON_KEYS as readonly string[]).includes(name);
}

/** Maps a skill name to its icon key, or undefined when it has no icon. */
export function resolveSkillIconKey(name: string): SkillIconKey | undefined {
  if (Object.prototype.hasOwnProperty.call(SKILL_ALIASES, name)) {
    return SKILL_ALIASES[name];
  }
  return isSkillIconKey(name) ? name : undefined;
}
