const BUCKET = "work-experience-documents";

export async function createWorkExperienceDocumentLink(path) {
  const { SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key } = process.env;
  if (!url || !key) return { error: "Document storage isn’t configured.", status: 500 };

  const objectPath = path.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(`${url}/storage/v1/object/sign/${BUCKET}/${objectPath}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, apikey: key, "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn: 60 }),
    cache: "no-store",
  });
  if (!response.ok) {
    console.error("work experience document link failed", response.status, await response.text().catch(() => ""));
    return { error: "Couldn’t open the document. Please try again.", status: 502 };
  }

  const data = await response.json();
  if (!data.signedURL) return { error: "Couldn’t open the document. Please try again.", status: 502 };
  return { url: new URL(`/storage/v1${data.signedURL}`, url).toString() };
}

export async function removeWorkExperienceDocuments(paths) {
  if (paths.length === 0) return null;
  const { SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key } = process.env;
  if (!url || !key) return "Document storage isn’t configured, so the document can’t be removed yet.";

  let response;
  try {
    response = await fetch(`${url}/storage/v1/object/${BUCKET}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${key}`, apikey: key, "Content-Type": "application/json" },
      body: JSON.stringify({ prefixes: paths }),
    });
  } catch (error) {
    console.error("work experience document delete failed", error);
    return "Couldn’t remove the work experience document. Please try again.";
  }
  if (!response.ok) {
    console.error("work experience document delete failed", response.status, await response.text().catch(() => ""));
    return "Couldn’t remove the work experience document. Please try again.";
  }
  return null;
}
