import { Card } from "@/components/ui/card";
import { LogoLockup } from "@/components/ui/logo-lockup";

export default function TermsPage() {
  return (
    <main className="px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card className="px-6 py-5">
          <LogoLockup />
        </Card>
        <Card className="space-y-6 p-8">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-slate-900">Terms of Use</h1>
          <div className="space-y-4 text-sm leading-7 text-slate-600">
            <p>Account access is personal. Multiple resumes may be created only for the same individual whose name is locked at signup.</p>
            <p>Downloads, AI exports, and paid features are validated server-side. Attempts to bypass payment, token checks, or export controls may trigger suspension and support review.</p>
            <p>Resume download access is time-bound. Mock interview generation is limited to one completed generation per qualifying payment.</p>
            <p>AI output is sanitized before delivery, but users remain responsible for factual accuracy in resumes and job application materials.</p>
          </div>
        </Card>
      </div>
    </main>
  );
}
