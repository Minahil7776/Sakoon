"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

const statusSchema = z.object({
  userId: z.string().uuid(),
  status: z.enum(["active", "suspended", "deactivated"]),
  reason: z.string().trim().max(300).optional(),
});

export async function setUserStatus(input) {
  const admin = await requireAdmin();
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const { userId, status, reason } = parsed.data;

  if (userId === admin.id) return { ok: false, error: "You can't change your own account status." };

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, status: true, email: true },
  });
  if (!target) return { ok: false, error: "User not found." };
  if (target.role === "admin") return { ok: false, error: "Admin accounts can't be changed here." };
  if (target.status === status) return { ok: true };

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { status } }),
    prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: "user.status_changed",
        targetType: "user",
        targetId: userId,
        metadata: { email: target.email, from: target.status, to: status, reason: reason || null },
      },
    }),
  ]);

  revalidatePath("/admin", "layout");
  return { ok: true };
}

const reviewSchema = z
  .object({
    userId: z.string().uuid(),
    decision: z.enum(["approved", "rejected", "additional_info_required"]),
    note: z.string().trim().max(500).optional(),
  })
  .refine((d) => d.decision === "approved" || (d.note && d.note.length >= 5), {
    message: "Please explain your decision (at least 5 characters). The applicant will see it.",
    path: ["note"],
  });

export async function reviewPsychologist(input) {
  const admin = await requireAdmin();
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { userId, decision, note } = parsed.data;

  const profile = await prisma.psychologistProfile.findUnique({
    where: { userId },
    select: { user: { select: { fullName: true, email: true } } },
  });
  if (!profile) return { ok: false, error: "Psychologist not found." };

  await prisma.$transaction([
    prisma.psychologistProfile.update({
      where: { userId },
      data: {
        verificationStatus: decision,
        reviewNote: decision === "approved" ? null : note,
        reviewedAt: new Date(),
        reviewedBy: admin.id,
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: "psychologist.reviewed",
        targetType: "psychologist",
        targetId: userId,
        metadata: {
          name: profile.user.fullName,
          email: profile.user.email,
          decision,
          note: note || null,
        },
      },
    }),
  ]);

  revalidatePath("/admin", "layout");
  return { ok: true };
}
