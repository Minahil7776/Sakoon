import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getPsychologistOrNull } from "@/lib/psychologist";
import { createWorkExperienceDocumentLink, removeWorkExperienceDocuments } from "@/lib/work-experience-documents";

const MAX = 10 * 1024 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function sniff(bytes) {
  if (bytes.subarray(0, 5).toString() === "%PDF-") return "application/pdf";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  return null;
}

async function getOwnedExperience(id, userId) {
  return prisma.workExperience.findFirst({
    where: { id, psychologistId: userId },
    select: { id: true, documentPath: true },
  });
}

export async function GET(_req, { params }) {
  const user = await getPsychologistOrNull();
  if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Invalid work experience." }, { status: 400 });
  const experience = await getOwnedExperience(id, user.id);
  if (!experience?.documentPath) return NextResponse.json({ error: "Document not found." }, { status: 404 });

  const link = await createWorkExperienceDocumentLink(experience.documentPath);
  if (link.error) return NextResponse.json({ error: link.error }, { status: link.status });
  return NextResponse.redirect(link.url, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req, { params }) {
  const user = await getPsychologistOrNull();
  if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Invalid work experience." }, { status: 400 });
  const experience = await getOwnedExperience(id, user.id);
  if (!experience) return NextResponse.json({ error: "Work experience not found." }, { status: 404 });

  const { SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key } = process.env;
  if (!url || !key) return NextResponse.json({ error: "Document storage isn’t configured yet." }, { status: 500 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a PDF, JPG or PNG document." }, { status: 400 });
  if (file.size === 0 || file.size > MAX) return NextResponse.json({ error: "Document must be smaller than 10 MB." }, { status: 400 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const contentType = sniff(bytes);
  if (!contentType) return NextResponse.json({ error: "Use a PDF, JPG or PNG document." }, { status: 400 });

  const path = `${user.id}/work-experience-${id}`;
  const response = await fetch(`${url}/storage/v1/object/work-experience-documents/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      apikey: key,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: bytes,
  });
  if (!response.ok) {
    console.error("work experience document upload failed", response.status, await response.text().catch(() => ""));
    return NextResponse.json({ error: "Couldn’t upload the document. Please try again." }, { status: 502 });
  }

  const updated = await prisma.workExperience.updateMany({
    where: { id, psychologistId: user.id },
    data: { documentPath: path },
  });
  if (updated.count !== 1) {
    const cleanupError = await removeWorkExperienceDocuments([path]);
    if (cleanupError) console.error("uploaded work experience document could not be cleaned up", cleanupError);
    return NextResponse.json({ error: "Work experience not found." }, { status: 404 });
  }

  revalidatePath("/psychologist", "layout");
  return NextResponse.json({ ok: true, path });
}

export async function DELETE(_req, { params }) {
  const user = await getPsychologistOrNull();
  if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Invalid work experience." }, { status: 400 });
  const experience = await getOwnedExperience(id, user.id);
  if (!experience?.documentPath) return NextResponse.json({ error: "Document not found." }, { status: 404 });

  const deleteError = await removeWorkExperienceDocuments([experience.documentPath]);
  if (deleteError) return NextResponse.json({ error: deleteError }, { status: 502 });

  await prisma.workExperience.updateMany({
    where: { id, psychologistId: user.id },
    data: { documentPath: null },
  });
  revalidatePath("/psychologist", "layout");
  return NextResponse.json({ ok: true });
}
