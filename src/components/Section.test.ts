import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import Section from "./Section.astro";

// Container HTML carries data-astro-* attributes, so assertions use
// tolerant regexes instead of exact tag matches.
describe("Section", () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  const render = (props: { title?: string; printed?: boolean }) =>
    container.renderToString(Section, {
      props,
      slots: { default: "slot body" },
    });

  it("does not add no-print when printed is omitted", async () => {
    const html = await render({ title: "Title" });
    expect(html).not.toContain("no-print");
  });

  it("does not add no-print when printed is true", async () => {
    const html = await render({ title: "Title", printed: true });
    expect(html).not.toContain("no-print");
  });

  it("adds no-print when printed is false", async () => {
    const html = await render({ title: "Title", printed: false });
    expect(html).toMatch(/<section[^>]*class="[^"]*no-print[^"]*"/);
  });

  it("renders the title in an h2 and the slot content", async () => {
    const html = await render({ title: "My Title" });
    expect(html).toMatch(/<h2[^>]*>My Title<\/h2>/);
    expect(html).toContain("slot body");
  });

  it("omits the h2 when no title is given", async () => {
    const html = await render({});
    expect(html).not.toMatch(/<h2/);
  });

  it("does not emit an empty script element", async () => {
    const html = await render({ title: "Title" });
    expect(html).not.toMatch(/<script[^>]*>\s*<\/script>/);
  });
});
