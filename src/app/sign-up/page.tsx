import { SignUpForm } from "@/components/auth/sign-up-form";
import { LegacyFlowShell } from "@/components/marketing/legacy-shell";

function getSafeNext(value: string | string[] | undefined) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/builder/import";
  }

  return value;
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const mobile = typeof params.mobile === "string" ? params.mobile : "";
  const next = getSafeNext(params.next);

  return <LegacyFlowShell signedIn={false} rightColumn={<SignUpForm defaultMobile={mobile} next={next} />} />;
}
