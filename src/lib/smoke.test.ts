import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import cv from "@cv";
import Section from "../components/Section.astro";

describe("test infrastructure smoke", () => {
  it("resolves the @cv alias to the real cv.json", () => {
    expect(typeof cv.basics.name).toBe("string");
    expect(cv.basics.name.length).toBeGreaterThan(0);
    expect(Array.isArray(cv.work)).toBe(true);
    expect(cv.work.length).toBeGreaterThan(0);
  });

  it("renders an .astro component through the Container API", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Section, {
      props: { title: "Smoke Title" },
      slots: { default: "slot body" },
    });

    expect(html).toMatch(/<h2[^>]*>Smoke Title<\/h2>/);
    expect(html).toContain("slot body");
  });
});
