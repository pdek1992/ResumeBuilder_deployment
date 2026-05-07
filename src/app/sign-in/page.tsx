import { SignInForm } from "@/components/auth/sign-in-form";
import { LegacyFlowShell } from "@/components/marketing/legacy-shell";

export default function SignInPage() {
  return <LegacyFlowShell signedIn={false} rightColumn={<SignInForm />} />;
}
