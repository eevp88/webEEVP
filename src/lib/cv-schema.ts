import { z } from "astro/zod"

// Only the API subset shared by Zod 3 and Zod 4 is used here (object, string,
// number, boolean, array, nullable, optional, regex, infer) so the Astro 6
// upgrade does not require touching this file.

/** ISO calendar date, e.g. 2024-08-01. */
const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const LocationSchema = z.object({
  address: z.string(),
  postalCode: z.string(),
  city: z.string(),
  countryCode: z.string(),
  region: z.string(),
})

export const ProfileSchema = z.object({
  network: z.string(),
  username: z.string(),
  url: z.string(),
})

export const BasicsSchema = z.object({
  name: z.string(),
  label: z.string(),
  image: z.string(),
  email: z.string(),
  phone: z.string(),
  url: z.string(),
  summary: z.string(),
  location: LocationSchema,
  profiles: z.array(ProfileSchema),
})

export const WorkSchema = z.object({
  name: z.string(),
  position: z.string(),
  url: z.string(),
  startDate: IsoDate,
  endDate: IsoDate.nullable(),
  summary: z.string(),
  highlights: z.array(z.string()),
  city: z.string().optional(),
  country: z.string().optional(),
})

export const EducationSchema = z.object({
  institution: z.string(),
  url: z.string(),
  area: z.string(),
  studyType: z.string(),
  startDate: IsoDate,
  endDate: IsoDate,
  score: z.string(),
  courses: z.array(z.string()),
})

export const SkillSchema = z.object({
  name: z.string(),
  level: z.string(),
  keywords: z.array(z.string()),
})

export const LanguageSchema = z.object({
  language: z.string(),
  fluency: z.string(),
})

export const ProjectSchema = z.object({
  name: z.string(),
  isActive: z.boolean(),
  description: z.string(),
  highlights: z.array(z.string()),
  url: z.string(),
  github: z.string().optional(),
})

export const AcknowledgmentsSchema = z.object({
  summary: z.string(),
})

// Filler sections inherited from the JSON Resume template. They are not
// rendered; they stay in cv.json as optional sections (decision Q4).
export const VolunteerSchema = z.object({
  organization: z.string(),
  position: z.string(),
  url: z.string(),
  startDate: IsoDate,
  endDate: IsoDate,
  summary: z.string(),
  highlights: z.array(z.string()),
})

export const AwardSchema = z.object({
  title: z.string(),
  date: IsoDate,
  awarder: z.string(),
  summary: z.string(),
})

export const CertificateSchema = z.object({
  name: z.string(),
  date: IsoDate,
  issuer: z.string(),
  url: z.string(),
})

export const PublicationSchema = z.object({
  name: z.string(),
  publisher: z.string(),
  releaseDate: IsoDate,
  url: z.string(),
  summary: z.string(),
})

export const InterestSchema = z.object({
  name: z.string(),
  keywords: z.array(z.string()),
})

export const ReferenceSchema = z.object({
  name: z.string(),
  reference: z.string(),
})

export const CvSchema = z.object({
  basics: BasicsSchema,
  work: z.array(WorkSchema),
  education: z.array(EducationSchema),
  skills: z.array(SkillSchema),
  languages: z.array(LanguageSchema),
  projects: z.array(ProjectSchema),
  acknowledgments: AcknowledgmentsSchema,
  volunteer: z.array(VolunteerSchema).optional(),
  awards: z.array(AwardSchema).optional(),
  certificates: z.array(CertificateSchema).optional(),
  publications: z.array(PublicationSchema).optional(),
  interests: z.array(InterestSchema).optional(),
  references: z.array(ReferenceSchema).optional(),
})

export type CV = z.infer<typeof CvSchema>
export type Basics = z.infer<typeof BasicsSchema>
export type Profile = z.infer<typeof ProfileSchema>
export type Work = z.infer<typeof WorkSchema>
export type Education = z.infer<typeof EducationSchema>
export type Skill = z.infer<typeof SkillSchema>
export type Language = z.infer<typeof LanguageSchema>
export type Project = z.infer<typeof ProjectSchema>
export type Acknowledgments = z.infer<typeof AcknowledgmentsSchema>
