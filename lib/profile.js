import { cache } from "react";
import { prisma } from "@/lib/prisma";

/** A psychologist must reach this score (and be verified) to appear in search and take bookings. */
export const BOOKABLE_THRESHOLD = 80;

export { fmtPKR } from "@/lib/options.mjs";

// 10 essentials = 80 points. 4 optional extras = 20 points.
const has = (p, type) => p.qualifications.some((q) => q.type === type);
const CHECKS = [
  { key: "photo", label: "Add a profile photo", points: 10, essential: true, section: "basic", ok: (p) => !!p.photoUrl },
  { key: "title", label: "Choose your professional title", points: 5, essential: true, section: "basic", ok: (p) => !!p.title },
  { key: "exp", label: "Add your years of experience", points: 5, essential: true, section: "basic", ok: (p) => p.experienceYears != null },
  { key: "lang", label: "Add the languages you speak", points: 5, essential: true, section: "basic", ok: (p) => p.languages.length > 0 },
  { key: "about", label: "Write your About section (150+ characters)", points: 15, essential: true, section: "about", ok: (p) => (p.bio?.trim().length ?? 0) >= 150 },
  { key: "spec", label: "Pick at least one specialization", points: 10, essential: true, section: "specializations", ok: (p) => p.specializations.length >= 1 },
  { key: "degree", label: "Add your education", points: 10, essential: true, section: "credentials", ok: (p) => has(p, "degree") },
  { key: "license", label: "Add your licence or registration", points: 10, essential: true, section: "credentials", ok: (p) => has(p, "license") },
  { key: "fee", label: "Set your consultation fee", points: 5, essential: true, section: "consultation", ok: (p) => p.consultationFee > 0 },
  { key: "duration", label: "Set your session length", points: 5, essential: true, section: "consultation", ok: (p) => !!p.sessionDuration },
  { key: "bio400", label: "Expand your About to 400+ characters", points: 5, section: "about", ok: (p) => (p.bio?.trim().length ?? 0) >= 400 },
  { key: "spec3", label: "List 3 or more specializations", points: 5, section: "specializations", ok: (p) => p.specializations.length >= 3 },
  { key: "cert", label: "Add a certification or extra training", points: 5, section: "credentials", ok: (p) => has(p, "certification") },
  { key: "inst", label: "Add your clinic or institution", points: 5, section: "basic", ok: (p) => !!p.institution?.trim() },
];

export function computeCompleteness(p) {
  const items = CHECKS.map(({ ok, ...c }) => ({ ...c, done: !!ok(p) }));
  const percent = items.filter((i) => i.done).reduce((s, i) => s + i.points, 0);
  return {
    percent,
    items,
    missingEssential: items.filter((i) => i.essential && !i.done),
    missingOptional: items.filter((i) => !i.essential && !i.done),
    meetsThreshold: percent >= BOOKABLE_THRESHOLD,
  };
}

export function visibilityOf(profile, percent) {
  if (profile.user.status !== "active") return { visible: false, reason: "Your account is not active." };
  if (profile.verificationStatus !== "approved") return { visible: false, reason: "Your credentials are not verified yet." };
  if (percent < BOOKABLE_THRESHOLD) return { visible: false, reason: `Reach ${BOOKABLE_THRESHOLD}% profile strength to appear in search.` };
  return { visible: true, reason: "Clients can find and book you." };
}

const INCLUDE = {
  user: { select: { fullName: true, email: true, phone: true, status: true } },
  specializations: {
    select: { isPrimary: true, specialization: { select: { id: true, name: true } } },
    orderBy: [{ isPrimary: "desc" }],
  },
  qualifications: { orderBy: [{ year: { sort: "desc", nulls: "last" } }, { createdAt: "asc" }] },
};

export const loadProfile = (userId) =>
  prisma.psychologistProfile.findUnique({ where: { userId }, include: INCLUDE });

/** The signed-in psychologist's own profile (created if missing). Cached per request. */
export const getOwnProfile = cache(async (userId) => {
  let p = await loadProfile(userId);
  if (!p) {
    await prisma.psychologistProfile.create({ data: { userId } });
    p = await loadProfile(userId);
  }
  return p;
});

/** Recompute and store the cached score. Call after every profile change. */
export async function syncStrength(userId) {
  const p = await loadProfile(userId);
  if (!p) return 0;
  const { percent } = computeCompleteness(p);
  if (percent !== p.profileStrength)
    await prisma.psychologistProfile.update({ where: { userId }, data: { profileStrength: percent } });
  return percent;
}

/**
 * The contract for the client-facing side: returns the profile only if it may be shown publicly
 * (verified + at least 80%), otherwise null. For listings use:
 *   where: { verificationStatus: "approved", profileStrength: { gte: BOOKABLE_THRESHOLD }, user: { status: "active" } }
 */
export async function getPublicProfile(userId) {
  const p = await loadProfile(userId);
  if (!p) return null;
  const { percent } = computeCompleteness(p);
  return visibilityOf(p, percent).visible ? p : null;
}
