import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Dashboard — Sakoon" };

export default async function Dashboard() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      fullName: true,
      role: true,
      status: true,
      psychologistProfile: { select: { verificationStatus: true } },
    },
  });
  // Deleted or suspended since signing in: clear the cookie, then go to login.
  if (!user || user.status !== "active") redirect("/api/auth/expired");
  if (user.role === "admin") redirect("/admin");

  const first = user.fullName.split(" ")[0];
  const message =
    user.role === "psychologist"
      ? user.psychologistProfile?.verificationStatus === "approved"
        ? "Your profile is verified. You can now set your availability."
        : "Your application is pending. Upload your credentials so an admin can verify you."
      : "Find a psychologist and book your first session.";

  return (
    <main className="dash">
      <div className="card">
        <h1>Hello, {first}</h1>
        <p className="lead">{message}</p>
        <form action="/api/auth/logout" method="post">
          <button className="btn ghost">Sign out</button>
        </form>
      </div>
    </main>
  );
}
