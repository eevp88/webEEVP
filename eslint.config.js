import js from "@eslint/js";
import tseslint from "typescript-eslint";
import astro from "eslint-plugin-astro";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  { ignores: ["dist/", ".astro/", "node_modules/"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs["flat/recommended"],
  {
    rules: {
      "no-console": "error",
      "no-var": "error",
      "@typescript-eslint/no-explicit-any": "error",
      // The raw cv.json alias is only read by the validated accessor.
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@cv",
              message: "Import from '@/lib/cv' instead of the raw '@cv' alias.",
            },
          ],
        },
      ],
    },
  },
  {
    // The accessor and the tests that exercise the alias itself may read it.
    files: ["src/lib/cv.ts", "src/lib/cv.test.ts", "src/lib/smoke.test.ts"],
    rules: { "no-restricted-imports": "off" },
  },
  {
    // Astro ships this file with triple-slash references by convention.
    files: ["src/env.d.ts"],
    rules: { "@typescript-eslint/triple-slash-reference": "off" },
  },
  // Must stay last: turns off rules that conflict with Prettier.
  prettier,
);
