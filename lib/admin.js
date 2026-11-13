import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Authoritative admin check. Reads the role and status from the database on every call,
 * so a demoted or suspended admin loses access immediately, not when their cookie expires.
 */
export async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, fullName: true, email: true, role: true, status: true },
  });
  if (!user || user.status !== "active") redirect("/api/auth/expired");
  if (user.role !== "admin") redirect("/dashboard");
  return user;
}
