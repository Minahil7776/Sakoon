import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { loginSchema, fieldErrors } from "@/lib/validation";

const DUMMY_HASH = "$2a$12$a4gb2GqaCHqjeC2CdnfbKuaAb1YL.J0GmOZ5v0.EEnxhTlBocDdwa";

export async function POST(req) {
  const parsed = loginSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success)
    return NextResponse.json({ errors: fieldErrors(parsed.error) }, { status: 400 });

  const { email, password } = parsed.data;
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true, status: true, passwordHash: true },
    });
    // Compare even when the user is missing so response time doesn't reveal which emails exist.
    const match = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

    if (!user || !match)
      return NextResponse.json(
        { errors: { form: "That email and password don't match. Check them and try again." } },
        { status: 401 }
      );
    if (user.status !== "active")
      return NextResponse.json(
        { errors: { form: "This account is not active. Contact support for help." } },
        { status: 403 }
      );

    await createSession(user);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("login failed", err.message);
    return NextResponse.json(
      { errors: { form: "Something went wrong on our side. Please try again." } },
      { status: 500 }
    );
  }
}
