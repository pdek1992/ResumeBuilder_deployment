"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiFetch } from "@/lib/client-api";
import { Button } from "@/components/ui/button";

export function ConsentCard({ consentGiven }: { consentGiven: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (consentGiven) {
    return null;
  }

  async function acceptConsent() {
    setLoading(true);
    setError("");

    try {
      await apiFetch("/api/auth/session-event", {
        method: "POST",
        body: JSON.stringify({
          event: "login",
          profile: {
            consent_given: true,
            consent_timestamp: new Date().toISOString(),
          },
        }),
      });

      router.push("/builder/import");
      router.refresh();
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : "Could not update consent");
      setLoading(false);
    }
  }

  return (
    <div className="mt-10 rounded-[2rem] border border-amber-200 bg-amber-50/80 p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-700">Action Required</p>
      <p className="mt-3 text-sm leading-6 text-amber-900">
        Accept the terms to continue creating and importing resumes. This unlocks the builder for your account.
      </p>

      {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}

      <Button className="mt-6" onClick={acceptConsent} disabled={loading}>
        {loading ? "Saving..." : "Accept and Continue"}
      </Button>
    </div>
  );
}
