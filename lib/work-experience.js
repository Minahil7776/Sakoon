import { z } from "zod";

const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Enter a valid month.");

export const workExperienceSchema = z.object({
  title: z.string().trim().min(2, "Enter a job title.").max(120),
  organization: z.string().trim().min(2, "Enter an organization.").max(120),
  location: z.string().trim().max(120).optional().default(""),
  startDate: monthSchema,
  endDate: z.preprocess(
    (value) => (value === "" || value == null ? null : value),
    monthSchema.nullable()
  ),
  current: z.boolean().default(false),
  description: z.string().trim().max(1000).optional().default(""),
}).superRefine((experience, ctx) => {
  if (experience.current && experience.endDate) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endDate"], message: "Leave the end date empty for your current role." });
  } else if (!experience.current && !experience.endDate) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endDate"], message: "Enter an end date or mark this as your current role." });
  } else if (experience.endDate && experience.endDate < experience.startDate) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endDate"], message: "End date must be on or after the start date." });
  }
});

export const profileWorkExperienceSchema = z.intersection(
  z.object({ id: z.string().uuid().optional() }),
  workExperienceSchema
);

export const toWorkExperienceData = (experience) => {
  const { id, ...data } = experience;
  return {
  ...data,
  location: experience.location || null,
  startDate: new Date(`${experience.startDate}-01T00:00:00.000Z`),
  endDate: experience.endDate ? new Date(`${experience.endDate}-01T00:00:00.000Z`) : null,
  description: experience.description || null,
  };
};
