"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePsychologist } from "@/lib/psychologist";
import { syncStrength, loadProfile, computeCompleteness, visibilityOf, BOOKABLE_THRESHOLD } from "@/lib/profile";
import { TITLES, SPECIALIZATIONS, LANGUAGES, SESSION_DURATIONS } from "@/lib/options.mjs";

const bad = (error) => ({ ok: false, error });
const firstError = (r) => r.error.issues[0].message;
const done = async (userId) => {
  await syncStrength(userId);
  revalidatePath("/psychologist", "layout");
  return { ok: true };
};
const where = (user) => ({ userId: user.id });

export async function saveBasics(input) {
  const user = await requirePsychologist();
  const p = z.object({
    title: z.enum(TITLES, { errorMap: () => ({ message: "Choose your professional title." }) }),
    experienceYears: z.number({ invalid_type_error: "Enter your years of experience.", required_error: "Enter your years of experience." })
      .int("Use a whole number.").min(0, "Enter a number between 0 and 60.").max(60, "Enter a number between 0 and 60."),
    institution: z.string().trim().max(120).optional(),
    languages: z.array(z.enum(LANGUAGES)).min(1, "Choose at least one language.").max(9),
  }).safeParse(input);
  if (!p.success) return bad(firstError(p));

  await prisma.psychologistProfile.update({
    where: where(user),
    data: { ...p.data, institution: p.data.institution || null },
  });
  return done(user.id);
}

export async function saveAbout(input) {
  const user = await requirePsychologist();
  const p = z.object({ bio: z.string().trim().max(1500, "Keep your About section under 1,500 characters.") }).safeParse(input);
  if (!p.success) return bad(firstError(p));
  await prisma.psychologistProfile.update({ where: where(user), data: { bio: p.data.bio || null } });
  return done(user.id);
}

export async function saveSpecializations(input) {
  const user = await requirePsychologist();
  const p = z.object({
    names: z.array(z.enum(SPECIALIZATIONS)).min(1, "Choose at least one specialization.").max(6, "Choose up to 6 specializations."),
    primary: z.string(),
  }).safeParse(input);
  if (!p.success) return bad(firstError(p));
  const names = [...new Set(p.data.names)];
  if (!names.includes(p.data.primary)) return bad("Choose your main focus from your selected specializations.");

  const specs = await Promise.all(
    names.map((name) => prisma.specialization.upsert({ where: { name }, update: {}, create: { name }, select: { id: true, name: true } }))
  );
  await prisma.$transaction([
    prisma.psychologistSpecialization.deleteMany({ where: { psychologistId: user.id } }),
    prisma.psychologistSpecialization.createMany({
      data: specs.map((s) => ({ psychologistId: user.id, specializationId: s.id, isPrimary: s.name === p.data.primary })),
    }),
  ]);
  return done(user.id);
}

const thisYear = new Date().getFullYear();
export async function addQualification(input) {
  const user = await requirePsychologist();
  const p = z.object({
    type: z.enum(["degree", "license", "certification"]),
    title: z.string().trim().min(2, "Enter a title.").max(120),
    institution: z.string().trim().min(2, "Enter the institution or issuing body.").max(120),
    year: z.number().int().min(1950, "Enter a valid year.").max(thisYear, "Enter a valid year.").nullable().optional(),
    reference: z.string().trim().max(60).optional(),
  }).refine((d) => d.type !== "license" || d.reference, { message: "Enter your licence number.", path: ["reference"] })
    .safeParse(input);
  if (!p.success) return bad(firstError(p));

  if ((await prisma.qualification.count({ where: { psychologistId: user.id } })) >= 15)
    return bad("You can list up to 15 qualifications.");

  await prisma.qualification.create({
    data: { ...p.data, year: p.data.year ?? null, reference: p.data.reference || null, psychologistId: user.id },
  });
  return done(user.id);
}

export async function removeQualification(id) {
  const user = await requirePsychologist();
  if (!z.string().uuid().safeParse(id).success) return bad("Invalid request.");
  await prisma.qualification.deleteMany({ where: { id, psychologistId: user.id } }); // ownership enforced here
  return done(user.id);
}

export async function saveConsultation(input) {
  const user = await requirePsychologist();
  const p = z.object({
    fee: z.number({ invalid_type_error: "Enter your fee.", required_error: "Enter your fee." })
      .int("Use a whole number.").min(500, "Enter a fee between PKR 500 and PKR 100,000.").max(100000, "Enter a fee between PKR 500 and PKR 100,000."),
    duration: z.number().refine((d) => SESSION_DURATIONS.includes(d), "Choose a session length."),
  }).safeParse(input);
  if (!p.success) return bad(firstError(p));
  await prisma.psychologistProfile.update({
    where: where(user),
    data: { consultationFee: p.data.fee, sessionDuration: p.data.duration },
  });
  return done(user.id);
}

export async function setInstant(enabled) {
  const user = await requirePsychologist();
  const profile = await loadProfile(user.id);
  if (enabled) {
    const vis = visibilityOf(profile, computeCompleteness(profile).percent);
    if (!vis.visible)
      return bad(`You can accept instant calls once you’re verified and your profile is at least ${BOOKABLE_THRESHOLD}% complete.`);
  }
  await prisma.psychologistProfile.update({ where: where(user), data: { acceptsInstant: !!enabled } });
  revalidatePath("/psychologist", "layout");
  return { ok: true };
}

export async function resubmitForReview() {
  const user = await requirePsychologist();
  const profile = await loadProfile(user.id);
  if (!["rejected", "additional_info_required"].includes(profile.verificationStatus))
    return bad("Your application doesn’t need to be resubmitted.");
  if (computeCompleteness(profile).percent < BOOKABLE_THRESHOLD)
    return bad(`Reach ${BOOKABLE_THRESHOLD}% profile strength before resubmitting.`);
  await prisma.psychologistProfile.update({ where: where(user), data: { verificationStatus: "pending" } });
  revalidatePath("/psychologist", "layout");
  revalidatePath("/admin", "layout");
  return { ok: true };
}
