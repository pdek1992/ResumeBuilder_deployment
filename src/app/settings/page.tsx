import Link from "next/link";

import { buildWhatsappSupportLink } from "@/lib/whatsapp";
import { requireUserProfile } from "@/lib/auth";
import { DeleteAccountCard } from "@/components/auth/delete-account-card";
import { AISettingsCard } from "@/components/settings/ai-settings-card";
import { TwoFactorSettingsCard } from "@/components/settings/two-factor-card";
import { PasskeySettingsCard } from "@/components/settings/passkey-card";
import { LegacyFlowShell } from "@/components/marketing/legacy-shell";

const fieldClassName =
  "mt-3 w-full rounded-[1.9rem] border-2 border-transparent bg-slate-50 px-6 py-5 text-[17px] font-semibold text-slate-700 outline-none transition placeholder:text-slate-400";
const labelClassName = "ml-2 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400";

export default async function SettingsPage() {
  const profile = await requireUserProfile();
  const supportLink = buildWhatsappSupportLink(
    [
      "Name lock change request",
      `User: ${profile.first_name} ${profile.last_name}`,
      `Email: ${profile.email}`,
      `Current name locked: ${profile.full_name_locked ? "yes" : "no"}`,
    ].join("\n"),
  );

  return (
    <LegacyFlowShell
      signedIn
      rightColumn={
        <section className="rounded-[3rem] border border-white/70 bg-white/82 px-6 py-8 shadow-[0_30px_80px_rgba(37,99,235,0.12)] backdrop-blur md:px-10 md:py-10">
          <p className="text-[12px] font-black uppercase tracking-[0.32em] text-primary">Settings</p>
          <h1 className="mt-6 font-display text-[3rem] font-black leading-[0.92] tracking-tight text-slate-950 md:text-[4.6rem]">
            Identity lock
            <br />
            and privacy
            <br />
            <span className="text-primary">controls</span>
          </h1>
          <p className="mt-8 max-w-2xl text-[18px] leading-10 text-slate-500 md:text-[1.35rem] md:leading-[2.8rem]">
            To change name contact support.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div>
              <label className={labelClassName}>First Name</label>
              <input value={profile.first_name} disabled className={fieldClassName} />
            </div>
            <div>
              <label className={labelClassName}>Last Name</label>
              <input value={profile.last_name} disabled className={fieldClassName} />
            </div>
            <div>
              <label className={labelClassName}>Email</label>
              <input value={profile.email} disabled className={fieldClassName} />
            </div>
            <div>
              <label className={labelClassName}>Mobile</label>
              <input value={profile.mobile ?? ""} disabled className={fieldClassName} />
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href={supportLink}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-slate-200 bg-white px-7 py-4 text-[12px] font-black uppercase tracking-[0.24em] text-slate-600 shadow-[0_12px_30px_rgba(15,23,42,0.05)]"
            >
              WhatsApp Support
            </a>
            <Link
              href="/dashboard"
              className="rounded-full bg-primary px-7 py-4 text-[12px] font-black uppercase tracking-[0.24em] text-white shadow-[0_18px_40px_rgba(48,103,234,0.22)]"
            >
              Back to Workspace
            </Link>
          </div>

          <DeleteAccountCard requiresPassword={profile.auth_provider === "password"} />
          
          <AISettingsCard initialConfig={profile.ai_config} />

          <TwoFactorSettingsCard />

          <PasskeySettingsCard />
        </section>
      }
    />
  );
}
