import type { z } from "zod";

import type {
  ApiErrorSchema,
  AwardSchema,
  CertificationSchema,
  ContactInputSchema,
  ContactResponseSchema,
  ContentPayloadSchema,
  ContentSectionSchema,
  EducationEntrySchema,
  ExperienceEntrySchema,
  HealthSchema,
  PageviewInputSchema,
  PageviewResponseSchema,
  ProfileSchema,
  ProjectSchema,
  ResearchPaperSchema,
  ResumeMetaSchema,
  SocialLinkSchema,
  StackItemSchema,
} from "./schemas";

/**
 * Types are inferred from the schemas rather than declared alongside them, so
 * there is exactly one definition of every wire shape.
 */

export type SocialLink = z.infer<typeof SocialLinkSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
export type StackItem = z.infer<typeof StackItemSchema>;
export type ExperienceEntry = z.infer<typeof ExperienceEntrySchema>;
export type EducationEntry = z.infer<typeof EducationEntrySchema>;
export type Award = z.infer<typeof AwardSchema>;
export type Certification = z.infer<typeof CertificationSchema>;
export type ResearchPaper = z.infer<typeof ResearchPaperSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type ContentPayload = z.infer<typeof ContentPayloadSchema>;
export type ContentSection = z.infer<typeof ContentSectionSchema>;

export type ContactInput = z.infer<typeof ContactInputSchema>;
export type ContactResponse = z.infer<typeof ContactResponseSchema>;

export type ResumeMeta = z.infer<typeof ResumeMetaSchema>;

export type PageviewInput = z.infer<typeof PageviewInputSchema>;
export type PageviewResponse = z.infer<typeof PageviewResponseSchema>;

export type ApiError = z.infer<typeof ApiErrorSchema>;
export type Health = z.infer<typeof HealthSchema>;
