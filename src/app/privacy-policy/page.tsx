import { Card } from "@/components/ui/card";
import { LogoLockup } from "@/components/ui/logo-lockup";
import { env } from "@/lib/env";

export default function PrivacyPolicyPage() {
  return (
    <main className="px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card className="px-6 py-5">
          <LogoLockup />
        </Card>
        <Card className="space-y-6 p-8">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-slate-900">Privacy Policy</h1>
          <p className="text-slate-600">This service follows a minimal compliance posture aligned to the Digital Personal Data Protection Act, 2023.</p>
          <div className="space-y-4 text-sm leading-7 text-slate-600">
            <p>We collect account identity data, resume content, payment state, support context, access logs, and AI-generated artifacts required to operate the service.</p>
            <p>Resume content may be processed by configured AI providers to generate summaries, cover letters, import mappings, ATS adjustments, and mock interviews.</p>
            <p>Payment processing is handled through Razorpay. We retain payment records for audit, compliance, and fraud prevention even if account content is deleted.</p>
            <p>Cloud storage and database services are provided through Supabase and deployment infrastructure is intended for Vercel production hosting.</p>
            <p>You can request deletion of personal account data from Settings. Resume data, AI content, and profile data are deleted or anonymized, while non-personal payment records remain.</p>
            <p>Support contact: {env.supportEmail}</p>
          </div>
        </Card>
      </div>
    </main>
  );
}
