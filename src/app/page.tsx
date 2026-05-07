import { getCurrentUserProfile } from "@/lib/auth";
import { LandingEntryCard } from "@/components/marketing/landing-entry-card";
import { LegacyFlowShell } from "@/components/marketing/legacy-shell";

export default async function HomePage() {
  const profile = await getCurrentUserProfile();

  return <LegacyFlowShell signedIn={Boolean(profile)} rightColumn={<LandingEntryCard signedIn={Boolean(profile)} />} />;
}
