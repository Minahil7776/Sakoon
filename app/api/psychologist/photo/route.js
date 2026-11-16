import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPsychologistOrNull } from "@/lib/psychologist";
import { syncStrength } from "@/lib/profile";
import { revalidatePath } from "next/cache";

const MAX = 2 * 1024 * 1024;

// Check the real file signature, not just the type the browser claims.
function sniff(b) {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return ["image/jpeg", "jpg"];
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return ["image/png", "png"];
  if (b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP") return ["image/webp", "webp"];
  return null;
}

export async function POST(req) {
  const user = await getPsychologistOrNull();
  if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const { SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key } = process.env;
  if (!url || !key) return NextResponse.json({ error: "Photo uploads aren’t configured yet." }, { status: 500 });

  const file = (await req.formData().catch(() => null))?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: "Image must be smaller than 2 MB." }, { status: 400 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const kind = sniff(bytes);
  if (!kind) return NextResponse.json({ error: "Use a JPG, PNG or WebP image." }, { status: 400 });

  const path = `${user.id}/avatar-${Date.now()}.${kind[1]}`;
  const res = await fetch(`${url}/storage/v1/object/avatars/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, apikey: key, "Content-Type": kind[0], "x-upsert": "true" },
    body: bytes,
  });
  if (!res.ok) {
    console.error("photo upload failed", res.status, await res.text().catch(() => ""));
    return NextResponse.json({ error: "Couldn’t upload the photo. Please try again." }, { status: 502 });
  }

  await prisma.psychologistProfile.update({
    where: { userId: user.id },
    data: { photoUrl: `${url}/storage/v1/object/public/avatars/${path}` },
  });
  await syncStrength(user.id);
  revalidatePath("/psychologist", "layout");
  return NextResponse.json({ ok: true });
}
