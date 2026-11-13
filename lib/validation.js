import { z } from "zod";

export const registerSchema = z.object({
  role: z.enum(["client", "psychologist"], { message: "Choose how you will use Sakoon." }),
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
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export function fieldErrors(error) {
  const out = {};
  for (const issue of error.issues) out[issue.path[0]] ??= issue.message;
  return out;
}
