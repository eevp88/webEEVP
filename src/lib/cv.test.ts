import { describe, expect, it } from "vitest";
import raw from "@cv";
import { cv, basics, work, skills } from "@/lib/cv";
import { CvSchema } from "@/lib/cv-schema";

describe("real cv.json", () => {
  it("parses against CvSchema and the accessor exposes the sections", () => {
    expect(CvSchema.safeParse(raw).success).toBe(true);
    expect(cv.basics).toBe(basics);
    expect(basics.name).toBe(raw.basics.name);
    expect(work.length).toBe(raw.work.length);
  });

  it("keeps startDate <= endDate for every job that has ended", () => {
    const ended = work.filter((job) => job.endDate !== null);
    expect(ended.length).toBeGreaterThan(0);
    for (const job of ended) {
      // ISO dates compare correctly as strings.
      expect(job.startDate <= (job.endDate as string)).toBe(true);
    }
  });

  it("lists at least one social profile", () => {
    expect(basics.profiles.length).toBeGreaterThan(0);
  });

  it("gives every skill a non-empty keywords list", () => {
    expect(skills.length).toBeGreaterThan(0);
    for (const skill of skills) {
      expect(skill.keywords.length).toBeGreaterThan(0);
    }
  });

  it("uses keywords, not key, in the PL/SQL skill", () => {
    const plsql = skills.find((skill) => skill.name === "PL/SQL");
    expect(plsql).toBeDefined();
    expect(plsql?.keywords.length).toBeGreaterThan(0);
    expect(plsql).not.toHaveProperty("key");
    const rawPlsql = raw.skills.find((skill) => skill.name === "PL/SQL");
    expect(rawPlsql).not.toHaveProperty("key");
  });

  it.each(["TypeScritp", "directamentetación", "Licenciadoen"])(
    "does not contain the known typo %s",
    (typo) => {
      expect(JSON.stringify(raw)).not.toContain(typo);
    },
  );
});
