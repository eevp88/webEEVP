import { describe, expect, it } from "vitest"
import { CvSchema } from "@/lib/cv-schema"

/** Minimal valid CV: only the required sections, no filler sections. */
function minimalCv() {
  return {
    basics: {
      name: "Ada Lovelace",
      label: "Engineer",
      image: "/ada.jpeg",
      email: "ada@example.com",
      phone: "+56900000000",
      url: "https://example.com",
      summary: "Summary",
      location: {
        address: "",
        postalCode: "5090041",
        city: "Valdivia",
        countryCode: "CL",
        region: "Chile",
      },
      profiles: [
        { network: "GitHub", username: "ada", url: "https://github.com/ada" },
      ],
    },
    work: [
      {
        name: "Company",
        position: "Developer",
        url: "https://company.example",
        startDate: "2020-01-01",
        endDate: "2021-01-01",
        summary: "Did things",
        highlights: ["TypeScript"],
        city: "Valdivia",
        country: "Chile",
      },
    ],
    education: [
      {
        institution: "University",
        url: "https://university.example",
        area: "Computer Science",
        studyType: "Bachelor",
        startDate: "2007-01-01",
        endDate: "2014-01-01",
        score: "5.9",
        courses: [""],
      },
    ],
    skills: [{ name: "TypeScript", level: "Advanced", keywords: ["Web"] }],
    languages: [{ language: "Spanish", fluency: "Native speaker" }],
    projects: [
      {
        name: "Portfolio",
        isActive: true,
        description: "A portfolio",
        highlights: ["Astro"],
        url: "https://example.com",
      },
    ],
    acknowledgments: { summary: "Thanks" },
  }
}

type Cv = ReturnType<typeof minimalCv>

function issuePaths(result: ReturnType<typeof CvSchema.safeParse>) {
  return result.success ? [] : result.error.issues.map((i) => i.path.join("."))
}

describe("CvSchema", () => {
  it("accepts a minimal valid CV", () => {
    const result = CvSchema.safeParse(minimalCv())
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.basics.name).toBe("Ada Lovelace")
      expect(result.data.work[0].city).toBe("Valdivia")
    }
  })

  it("accepts work[].endDate null (current job) and a non-null date", () => {
    const current = minimalCv()
    ;(current.work[0] as { endDate: string | null }).endDate = null
    expect(CvSchema.safeParse(current).success).toBe(true)
    expect(CvSchema.safeParse(minimalCv()).success).toBe(true)
  })

  it("rejects a date that is not YYYY-MM-DD", () => {
    const bad = minimalCv()
    bad.work[0].startDate = "2024/08/01"
    const result = CvSchema.safeParse(bad)
    expect(result.success).toBe(false)
    expect(issuePaths(result)).toContain("work.0.startDate")
  })

  it("rejects a CV without acknowledgments", () => {
    const bad: Partial<Cv> = minimalCv()
    delete bad.acknowledgments
    const result = CvSchema.safeParse(bad)
    expect(result.success).toBe(false)
    expect(issuePaths(result)).toContain("acknowledgments")
  })

  it("reports basics.name in the issue path when it is missing", () => {
    const bad = minimalCv() as { basics: Partial<Cv["basics"]> }
    delete bad.basics.name
    const result = CvSchema.safeParse(bad)
    expect(result.success).toBe(false)
    expect(issuePaths(result)).toContain("basics.name")
  })

  it("reports the full path of a number inside work[].highlights", () => {
    const bad = minimalCv() as { work: { highlights: unknown[] }[] }
    bad.work[0].highlights = [42]
    const result = CvSchema.safeParse(bad)
    expect(result.success).toBe(false)
    expect(issuePaths(result)).toContain("work.0.highlights.0")
  })

  it("accepts a CV without the filler sections", () => {
    const cv = minimalCv() as Record<string, unknown>
    for (const key of [
      "volunteer",
      "awards",
      "certificates",
      "publications",
      "interests",
      "references",
    ]) {
      expect(key in cv).toBe(false)
    }
    expect(CvSchema.safeParse(cv).success).toBe(true)
  })

  it("accepts a CV that includes the filler sections", () => {
    const cv = {
      ...minimalCv(),
      volunteer: [
        {
          organization: "Org",
          position: "Volunteer",
          url: "https://org.example",
          startDate: "2012-01-01",
          endDate: "2013-01-01",
          summary: "Helped",
          highlights: ["Award"],
        },
      ],
      awards: [
        {
          title: "Award",
          date: "2014-11-01",
          awarder: "Company",
          summary: "Won",
        },
      ],
      certificates: [
        {
          name: "Certificate",
          date: "2021-11-07",
          issuer: "Company",
          url: "https://certificate.example",
        },
      ],
      publications: [
        {
          name: "Publication",
          publisher: "Company",
          releaseDate: "2014-10-01",
          url: "https://publication.example",
          summary: "Described",
        },
      ],
      interests: [{ name: "Wildlife", keywords: ["Ferrets"] }],
      references: [{ name: "Ref", reference: "Reference" }],
    }
    const result = CvSchema.safeParse(cv)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.awards?.[0].title).toBe("Award")
    }
  })

  it("rejects a malformed filler section when it is present", () => {
    const bad = { ...minimalCv(), awards: [{ title: 7 }] }
    const result = CvSchema.safeParse(bad)
    expect(result.success).toBe(false)
    expect(issuePaths(result)).toContain("awards.0.title")
  })

  it("rejects a skill without keywords (Q5: content is corrected, not tolerated)", () => {
    const bad = minimalCv() as { skills: Record<string, unknown>[] }
    bad.skills = [
      { name: "PL/SQL", level: "Avanzado", key: ["Bases de Datos"] },
    ]
    const result = CvSchema.safeParse(bad)
    expect(result.success).toBe(false)
    expect(issuePaths(result)).toContain("skills.0.keywords")
  })
})
