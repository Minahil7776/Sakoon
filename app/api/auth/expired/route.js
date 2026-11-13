import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

// Clears a session whose user no longer exists or is no longer active.
export async function GET(req) {
  await destroySession();
  return NextResponse.redirect(new URL("/login", req.url));
}
