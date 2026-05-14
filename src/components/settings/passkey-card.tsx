"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";

export function PasskeySettingsCard() {
  const [factors, setFactors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = getSupabaseBrowserClient();

  const fetchFactors = useCallback(async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
      setError(error.message);
    } else {
      setFactors(data.all.filter((f: any) => f.factor_type === "webauthn"));
    }
  }, [supabase]);

  useEffect(() => {
    void Promise.resolve().then(fetchFactors);
  }, [fetchFactors]);

  async function handleEnroll() {
    setLoading(true);
    setError("");
    
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "webauthn",
      });

      if (error) throw error;

      // The browser will handle the WebAuthn ceremony via the Supabase SDK
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId: data.id,
      });

      if (verifyError) throw verifyError;

      fetchFactors();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUnenroll(factorId: string) {
    setLoading(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) {
      setError(error.message);
    } else {
      fetchFactors();
    }
    setLoading(false);
  }

  return (
    <div className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">Passkeys</p>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        Secure your account with biometric login or hardware security keys.
      </p>

      {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}

      <div className="mt-6 space-y-4">
        {factors.map((factor) => (
          <div key={factor.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-4 border border-slate-100">
            <div>
              <p className="text-sm font-bold text-slate-700">{factor.friendly_name || "Passkey"}</p>
              <p className="text-xs text-slate-500 mt-1">Added on {new Date(factor.created_at).toLocaleDateString()}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => handleUnenroll(factor.id)} disabled={loading}>
              Remove
            </Button>
          </div>
        ))}

        <Button onClick={handleEnroll} disabled={loading} variant="secondary">
          Add a Passkey
        </Button>
      </div>
    </div>
  );
}
