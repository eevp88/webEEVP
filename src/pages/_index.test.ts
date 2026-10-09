import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import { basics, skills } from "@/lib/cv";
import Index from "./index.astro";

// Characterization test (the underscore prefix keeps Astro from routing this file): pins the text content of the home page so the icon
// refactor (Hero, KeyboardManager) cannot silently drop content. Assertions
// are plain substrings; the Container HTML carries data-astro-* attributes.
describe("index page (characterization)", () => {
  let html: string;

  beforeAll(async () => {
    const container = await AstroContainer.create();
    html = await container.renderToString(Index);
  });

  it("renders the name and label", () => {
    expect(html).toContain(basics.name);
    expect(html).toContain(basics.label);
  });

  it("renders every section title", () => {
    for (const title of [
      "Sobre mí",
      "Experiencia laboral",
      "Educación",
      "Proyectos",
      "Habilidades",
    ]) {
      expect(html).toContain(title);
    }
  });

  it("renders the url of every profile", () => {
    expect(basics.profiles.length).toBeGreaterThan(0);
    for (const { url } of basics.profiles) {
      expect(html).toContain(url);
    }
  });

  it("renders every skill name", () => {
    for (const { name } of skills) {
      expect(html).toContain(name);
    }
  });

  it("renders the acknowledgments section title", () => {
    expect(html).toContain("Agradecimientos");
  });
});
