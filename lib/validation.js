import { z } from "zod";
import { TITLES, SPECIALIZATIONS } from "@/lib/options.mjs";

const account = {
  fullName: z.string().trim().min(2, "Enter your full name.").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s-]{7,18}$/, "Enter a valid phone number, for example +92 300 1234567."),
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .regex(/[A-Za-z]/, "Include at least one letter.")
    .regex(/[0-9]/, "Include at least one number."),
};

const pick = (values, message) => z.enum(values, { errorMap: () => ({ message }) });

const clientSchema = z.object({ role: z.literal("client"), ...account });

const psychologistSchema = z
  .object({
    role: z.literal("psychologist"),
    ...account,
    title: pick(TITLES, "Choose your professional title."),
    specialization: pick(SPECIALIZATIONS, "Choose your main area of practice."),
    qualification: z.string().trim().min(2, "Enter your highest qualification, e.g. M.Sc Clinical Psychology.").max(120),
    institution: z.string().trim().min(2, "Enter the institution you studied at.").max(120),
    licenseNumber: z.string().trim().max(60).optional().default(""),
    licenseBody: z.string().trim().max(120).optional().default(""),
  })
  .refine((d) => !d.licenseNumber || d.licenseBody, { message: "Enter who issued this licence.", path: ["licenseBody"] });

export function parseRegistration(body) {
  return (body?.role === "psychologist" ? psychologistSchema : clientSchema).safeParse(body);
}

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export function fieldErrors(error) {
  const out = {};
  for (const issue of error.issues) out[issue.path[0]] ??= issue.message;
  return out;
}
