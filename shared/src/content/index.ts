import type { ContentPayload } from "../types";

import { awards } from "./awards";
import { education } from "./education";
import { experience } from "./experience";
import { profile } from "./profile";
import { projects } from "./projects";
import { research } from "./research";
import { stack } from "./stack";

export { awards, education, experience, profile, projects, research, stack };

/**
 * The canonical content payload.
 *
 * The API serves this (and can later back it with the database instead); the
 * web app imports it as a build-time fallback, so a page still renders if the
 * API is unreachable during a build.
 */
export const content: ContentPayload = {
  profile,
  stack,
  experience,
  research,
  projects,
  education,
  awards,
};
