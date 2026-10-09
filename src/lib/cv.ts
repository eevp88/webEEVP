import raw from "@cv";
import { CvSchema, type CV } from "@/lib/cv-schema";

/**
 * Validated CV data. Parsing runs at module load, so an invalid cv.json fails
 * `pnpm build` and `pnpm test` with the offending field path in the error.
 */
export const cv: CV = CvSchema.parse(raw);

export const {
  basics,
  work,
  education,
  skills,
  languages,
  projects,
  acknowledgments,
} = cv;
