import { describe, expect, it } from "vitest";
import { basics, skills } from "@/lib/cv";
import {
  FALLBACK_SOCIAL_ICON,
  SKILL_ICON_KEYS,
  SOCIAL_ICONS,
  SOCIAL_NETWORKS,
  getSocialIcon,
  isKnownNetwork,
  renderSvg,
  resolveSkillIconKey,
} from "@/lib/icons";

describe("getSocialIcon", () => {
  it.each(["GitHub", "LinkedIn", "X"] as const)(
    "resolves the known network %s from the registry",
    (network) => {
      const icon = getSocialIcon(network);
      expect(icon).toBe(SOCIAL_ICONS[network]);
      expect(icon).not.toBe(FALLBACK_SOCIAL_ICON);
      expect(icon.title).toBe(network);
    },
  );

  it("returns the fallback with the network as title for an unknown network", () => {
    const icon = getSocialIcon("Mastodon");
    expect(icon).toBeDefined();
    expect(icon.paths).toEqual(FALLBACK_SOCIAL_ICON.paths);
    expect(icon.viewBox).toBe(FALLBACK_SOCIAL_ICON.viewBox);
    expect(icon.title).toBe("Mastodon");
  });

  it("matches the network name exactly (no case normalization)", () => {
    expect(getSocialIcon("GitHub")).not.toBe(FALLBACK_SOCIAL_ICON);
    const lower = getSocialIcon("github");
    expect(lower.paths).toEqual(FALLBACK_SOCIAL_ICON.paths);
    expect(lower.title).toBe("github");
  });

  it("does not resolve inherited object keys such as constructor", () => {
    const icon = getSocialIcon("constructor");
    expect(icon.paths).toEqual(FALLBACK_SOCIAL_ICON.paths);
    expect(icon.title).toBe("constructor");
  });
});

describe("isKnownNetwork", () => {
  it("accepts only exact registry keys", () => {
    for (const network of SOCIAL_NETWORKS) {
      expect(isKnownNetwork(network)).toBe(true);
    }
    expect(isKnownNetwork("Mastodon")).toBe(false);
    expect(isKnownNetwork("github")).toBe(false);
    expect(isKnownNetwork("constructor")).toBe(false);
  });
});

describe("renderSvg", () => {
  const icon = { title: "Demo", viewBox: "0 0 24 24", paths: ["M0 0h1v1z"] };

  it("uses 16 as the default size and omits style when not given", () => {
    const svg = renderSvg(icon);
    expect(svg).toContain('width="16"');
    expect(svg).toContain('height="16"');
    expect(svg).toContain('viewBox="0 0 24 24"');
    expect(svg).toContain('d="M0 0h1v1z"');
    expect(svg).toContain("<title>Demo</title>");
    expect(svg).not.toContain("style=");
  });

  it("honors a custom size and applies the style", () => {
    const svg = renderSvg(icon, { size: 32, style: "margin-right: 8px" });
    expect(svg).toContain('width="32"');
    expect(svg).toContain('height="32"');
    expect(svg).toContain('style="margin-right: 8px"');
  });

  it("escapes the title so it cannot inject markup", () => {
    const svg = renderSvg({ ...icon, title: '<x onload="a">' });
    expect(svg).not.toContain("<x");
    expect(svg).toContain("&lt;x onload=&quot;a&quot;&gt;");
  });

  it("escapes the style so it cannot break out of the attribute", () => {
    const svg = renderSvg(icon, { style: 'a" onclick="b' });
    expect(svg).not.toContain('onclick="b"');
    expect(svg).toContain('style="a&quot; onclick=&quot;b"');
  });
});

describe("profiles in cv.json", () => {
  it("only use networks that exist in the registry", () => {
    for (const { network } of basics.profiles) {
      expect(isKnownNetwork(network), network).toBe(true);
    }
  });
});

describe("resolveSkillIconKey", () => {
  it.each([
    ["Next.js", "Next"],
    ["Astro", "AstroBuild"],
    ["PL/SQL", "Oracle"],
    ["LaTeX", "Latex"],
  ])("maps the alias %s to %s", (name, key) => {
    expect(resolveSkillIconKey(name)).toBe(key);
  });

  it("is the identity for keys of the registry", () => {
    for (const key of SKILL_ICON_KEYS) {
      expect(resolveSkillIconKey(key)).toBe(key);
    }
  });

  it("returns undefined for unknown skills", () => {
    expect(resolveSkillIconKey("Bootstrap")).toBeUndefined();
    expect(resolveSkillIconKey("constructor")).toBeUndefined();
  });
});

describe("skill icons without a matching skill", () => {
  // Decision Q7: these icons are kept in the registry on purpose even though
  // no skill in cv.json resolves to them today. If a skill is added for one
  // of them, update this list instead of deleting the icon.
  it("are exactly Next, Swift, SwiftUI, Kotlin and Flutter", () => {
    const used = new Set(skills.map(({ name }) => resolveSkillIconKey(name)));
    const unused = SKILL_ICON_KEYS.filter((key) => !used.has(key));
    expect([...unused].sort()).toEqual(
      ["Flutter", "Kotlin", "Next", "Swift", "SwiftUI"].sort(),
    );
  });
});

describe("skill icon registry vs Skills.astro", () => {
  // Keys that Skills.astro maps to a component. Keep in sync with the
  // `satisfies Record<SkillIconKey, unknown>` map in that file.
  const SKILLS_COMPONENT_KEYS = [
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
    "Next",
    "Swift",
    "SwiftUI",
    "Kotlin",
    "Flutter",
  ];

  it("has exactly the keys that Skills.astro maps", () => {
    expect([...SKILL_ICON_KEYS].sort()).toEqual(
      [...SKILLS_COMPONENT_KEYS].sort(),
    );
  });

  it("resolves every skill of cv.json except the ones without an icon", () => {
    const withoutIcon = ["Bootstrap"];
    for (const { name } of skills) {
      if (withoutIcon.includes(name)) {
        expect(resolveSkillIconKey(name), name).toBeUndefined();
      } else {
        expect(resolveSkillIconKey(name), name).toBeDefined();
      }
    }
  });
});

describe("Skills.astro wiring", () => {
  const sources = import.meta.glob("../components/sections/Skills.astro", {
    query: "?raw",
    import: "default",
    eager: true,
  }) as Record<string, string>;
  const source = Object.values(sources)[0] ?? "";

  it("resolves icons through the registry instead of a ternary chain", () => {
    expect(source).toContain("resolveSkillIconKey");
    expect(source).not.toContain('name === "Next.js"');
  });

  it("declares an exhaustive component map with satisfies", () => {
    expect(source).toMatch(/satisfies\s+Record<SkillIconKey,\s*unknown>/);
  });
});
