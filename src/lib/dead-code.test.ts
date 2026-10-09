import { describe, expect, it } from "vitest";

// Files removed by the technical cleanup must not come back. Globs resolve
// at transform time, so an existing file shows up as a key.
describe("removed files", () => {
  it("no longer has the any-typed SocialIcon declaration", () => {
    const files = import.meta.glob("../types.d.ts", {
      query: "?raw",
      import: "default",
      eager: true,
    });
    expect(Object.keys(files)).toEqual([]);
  });

  it("no longer has the unreferenced astro.svg and background.svg assets", () => {
    const files = import.meta.glob(
      ["../assets/astro.svg", "../assets/background.svg"],
      { query: "?url", import: "default", eager: true },
    );
    expect(Object.keys(files)).toEqual([]);
  });
});
