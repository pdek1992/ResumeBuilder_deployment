import { SignInForm } from "@/components/auth/sign-in-form";
import { LegacyFlowShell } from "@/components/marketing/legacy-shell";

function getSafeNext(value: string | string[] | undefined) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = getSafeNext(params.next);

  return <LegacyFlowShell signedIn={false} rightColumn={<SignInForm next={next} />} />;
}
