import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;

// Supabase exposes the public schema over its REST API. Enabling RLS with no
// policies means only this server (using the DB password) can read these tables.
for (const table of ["users", "client_profiles", "psychologist_profiles", "audit_logs"]) {
  await prisma.$executeRawUnsafe(`alter table public."${table}" enable row level security`);
}
console.log("Row Level Security enabled.");

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
