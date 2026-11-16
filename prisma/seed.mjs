import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SPECIALIZATIONS } from "../lib/options.mjs";

const prisma = new PrismaClient();
const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;

// Supabase exposes the public schema over its REST API. Enabling RLS with no
// policies means only this server (using the DB password) can read these tables.
for (const table of [
  "users", "client_profiles", "psychologist_profiles",
  "consultations", "consultation_payments", "audit_logs",
  "specializations", "psychologist_specializations", "qualifications",
]) {
  await prisma.$executeRawUnsafe(`alter table public."${table}" enable row level security`);
}
console.log("Row Level Security enabled.");

for (const name of SPECIALIZATIONS) {
  await prisma.specialization.upsert({ where: { name }, update: {}, create: { name } });
}
console.log(`${SPECIALIZATIONS.length} specializations ready.`);

if (ADMIN_EMAIL && ADMIN_PASSWORD) {
  const email = ADMIN_EMAIL.trim().toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) console.log("Admin already exists.");
  else {
    await prisma.user.create({
      data: {
        fullName: ADMIN_NAME || "Platform Admin",
        email,
        passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12),
        role: "admin",
        emailVerified: true,
      },
    });
    console.log("Admin account created.");
  }
}
await prisma.$disconnect();
