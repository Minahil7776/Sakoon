import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { parseRegistration, fieldErrors } from "@/lib/validation";
import { syncStrength } from "@/lib/profile";

export async function POST(req) {
  const parsed = parseRegistration(await req.json().catch(() => ({})));
  if (!parsed.success)
    return NextResponse.json({ errors: fieldErrors(parsed.error) }, { status: 400 });

  const d = parsed.data;

  try {
    // One nested write: the user, profile, specialization and credentials are created together or not at all.
    const user = await prisma.user.create({
      data: {
        fullName: d.fullName,
        email: d.email,
        phone: d.phone,
        role: d.role,
        passwordHash: await bcrypt.hash(d.password, 12),
        ...(d.role === "client"
          ? { clientProfile: { create: {} } }
          : {
              psychologistProfile: {
                create: {
                  title: d.title,
                  experienceYears: d.experienceYears,
                  specializations: {
                    create: [{
                      isPrimary: true,
                      specialization: { connectOrCreate: { where: { name: d.specialization }, create: { name: d.specialization } } },
                    }],
                  },
                  qualifications: {
                    create: [
                      { type: "degree", title: d.qualification, institution: d.institution },
                      ...(d.licenseNumber
                        ? [{ type: "license", title: "Professional licence", institution: d.licenseBody, reference: d.licenseNumber }]
                        : []),
                    ],
                  },
                },
              },
            }),
      },
      select: { id: true, role: true },
    });

    if (user.role === "psychologist") await syncStrength(user.id).catch(() => {});
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
