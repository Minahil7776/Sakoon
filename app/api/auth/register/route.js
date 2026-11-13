import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { registerSchema, fieldErrors } from "@/lib/validation";

export async function POST(req) {
  const parsed = registerSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success)
    return NextResponse.json({ errors: fieldErrors(parsed.error) }, { status: 400 });

  const { role, fullName, email, phone, password } = parsed.data;

  try {
    // One nested write: the user and their profile are created together or not at all.
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        phone,
        role,
        passwordHash: await bcrypt.hash(password, 12),
        ...(role === "client"
          ? { clientProfile: { create: {} } }
          : { psychologistProfile: { create: {} } }),
      },
      select: { id: true, role: true },
    });
    await createSession(user);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err.code === "P2002")
      return NextResponse.json(
        { errors: { email: "An account with this email already exists. Try signing in." } },
        { status: 409 }
      );
    console.error("register failed", err.message);
    return NextResponse.json(
      { errors: { form: "We couldn't create your account. Please try again." } },
      { status: 500 }
    );
  }
}
