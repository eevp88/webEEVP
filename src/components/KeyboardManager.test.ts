import { describe, expect, it } from "vitest";
import { SOCIAL_ICONS } from "@/lib/icons";

// Source-level checks: KeyboardManager renders a client <script>, so the
// cleanup is pinned by reading the file instead of rendering it.
const sources = import.meta.glob("./KeyboardManager.astro", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;
const source = Object.values(sources)[0] ?? "";

describe("KeyboardManager source", () => {
  it("has a source to inspect", () => {
    expect(source.length).toBeGreaterThan(0);
  });

  it("builds network icons from the shared registry", () => {
    expect(source).toContain("renderSvg(");
    expect(source).toContain("getSocialIcon(");
  });

  it("does not duplicate the social network SVGs", () => {
    for (const { paths } of Object.values(SOCIAL_ICONS)) {
      expect(source).not.toContain(paths[0]);
    }
    expect(source).not.toMatch(/\b(GitHub|LinkedIn|X):\s*`<svg/);
  });

  it("does not import the removed SocialIcon type", () => {
    expect(source).not.toContain("@/types");
  });

  it("has no console logging calls", () => {
    expect(source).not.toMatch(/console\.log/);
  });

  it("has no var declarations", () => {
    expect(source).not.toMatch(/\bvar\s/);
  });

  // Characterization (decision Q6, out of scope): the theme commands keep
  // toggling the theme and ctrl+C keeps its binding. Do not "fix" here.
  it("keeps the theme command behavior untouched", () => {
    expect(source.match(/handleToggleClick\(\);/g)).toHaveLength(3);
    expect(source).toContain('hotkey: "ctrl+C"');
    expect(source).toContain('id: "automatico"');
  });
});
