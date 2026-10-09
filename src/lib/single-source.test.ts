import { describe, expect, it } from "vitest";

// Raw source of every .astro/.ts file under src, keyed by "/src/<path>".
// import.meta.glob avoids a dependency on node typings.
const sources = import.meta.glob<string>("/src/**/*.{astro,ts}", {
  query: "?raw",
  import: "default",
  eager: true,
});

// The raw @cv alias may only be imported by the validated accessor and by the
// smoke test that checks the alias itself.
const ALLOWED_RAW_IMPORTERS = [
  "/src/lib/cv.ts",
  "/src/lib/cv.test.ts",
  "/src/lib/smoke.test.ts",
];

describe("CV single source of truth", () => {
  it("only the accessor (and alias tests) import @cv directly", () => {
    const offenders = Object.entries(sources)
      .filter(([file]) => !ALLOWED_RAW_IMPORTERS.includes(file))
      .filter(([, code]) => /from\s+["']@cv["']/.test(code))
      .map(([file]) => file);

    expect(offenders).toEqual([]);
  });

  it("components and pages read CV data from @/lib/cv", () => {
    const consumers = [
      "/src/pages/index.astro",
      "/src/layouts/Layout.astro",
      "/src/components/KeyboardManager.astro",
      "/src/components/sections/Hero.astro",
      "/src/components/sections/About.astro",
      "/src/components/sections/Experience.astro",
      "/src/components/sections/Education.astro",
      "/src/components/sections/Projects.astro",
      "/src/components/sections/Skills.astro",
      "/src/components/sections/Acknowledgments.astro",
    ];
    const missing = consumers.filter(
      (file) => !/from\s+["']@\/lib\/cv["']/.test(sources[file] ?? ""),
    );

    expect(missing).toEqual([]);
  });

  it("the duplicated hand-written CV type file is gone", () => {
    expect(Object.keys(sources)).not.toContain("/src/cv.d.ts");
  });
});
