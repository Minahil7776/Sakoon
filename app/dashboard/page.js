import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Dashboard — Sakoon" };

export default async function Dashboard() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { fullName: true, role: true, status: true },
  });
  // Deleted or suspended since signing in: clear the cookie, then go to login.
  if (!user || user.status !== "active") redirect("/api/auth/expired");
  if (user.role === "admin") redirect("/admin");
  if (user.role === "psychologist") redirect("/psychologist");

  return (
    <main className="dash">
      <div className="card">
        <h1>Hello, {user.fullName.split(" ")[0]}</h1>
        <p className="lead">Find a psychologist and book your first session.</p>
        <form action="/api/auth/logout" method="post">
          <button className="btn ghost">Sign out</button>
        </form>
      </div>
    </main>
  );
}
