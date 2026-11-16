import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SELECT = { id: true, fullName: true, email: true, role: true, status: true };

/** For API routes: returns the active psychologist, or null. */
export async function getPsychologistOrNull() {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: SELECT });
  return user && user.status === "active" && user.role === "psychologist" ? user : null;
}

/** For pages and actions: checks the role against the database on every call. */
export async function requirePsychologist() {
  const session = await getSession();
  if (!session) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: SELECT });
  if (!user || user.status !== "active") redirect("/api/auth/expired");
  if (user.role !== "psychologist") redirect(user.role === "admin" ? "/admin" : "/dashboard");
  return user;
}
