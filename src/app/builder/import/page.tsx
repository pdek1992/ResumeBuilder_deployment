import { redirect } from "next/navigation";

import { requireUserProfile } from "@/lib/auth";
import { ImportStep } from "@/components/builder/import-step";
import { LegacyFlowShell } from "@/components/marketing/legacy-shell";

export default async function BuilderImportPage() {
  const profile = await requireUserProfile("/builder/import");

  if (!profile.consent_given) {
    redirect("/settings");
  }

  return <LegacyFlowShell signedIn profileName={profile.first_name || profile.username} rightColumn={<ImportStep />} />;
}
