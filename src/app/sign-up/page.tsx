import { SignUpForm } from "@/components/auth/sign-up-form";
import { LegacyFlowShell } from "@/components/marketing/legacy-shell";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const mobile = typeof params.mobile === "string" ? params.mobile : "";

  return <LegacyFlowShell signedIn={false} rightColumn={<SignUpForm defaultMobile={mobile} />} />;
}
