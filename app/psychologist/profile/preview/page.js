import { requirePsychologist } from "@/lib/psychologist";
import { getOwnProfile, computeCompleteness, visibilityOf } from "@/lib/profile";
import PublicProfile from "@/components/PublicProfile";

export const metadata = { title: "Preview — Sakoon" };

export default async function Preview() {
  const user = await requirePsychologist();
  const profile = await getOwnProfile(user.id);
  const vis = visibilityOf(profile, computeCompleteness(profile).percent);

  return (
    <>
      <div className={`p-banner ${vis.visible ? "ok" : "warn"}`}>
        <strong>{vis.visible ? "This is what clients see." : "Clients can’t see this yet."}</strong> {vis.reason}
      </div>
      <PublicProfile profile={profile} preview />
    </>
  );
}
