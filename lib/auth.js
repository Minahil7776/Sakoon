import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE = "sakoon_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const key = () => new TextEncoder().encode(process.env.JWT_SECRET);

export async function createSession(user) {
  const token = await new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(key());

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function getSession() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return { userId: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export const SESSION_COOKIE = COOKIE;
