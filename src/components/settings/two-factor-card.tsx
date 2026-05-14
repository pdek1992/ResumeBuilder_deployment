"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TwoFactorSettingsCard() {
  const [factors, setFactors] = useState<any[]>([]);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    fetchFactors();
  }, []);

  async function fetchFactors() {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
      setError(error.message);
    } else {
      setFactors(data.all);
    }
  }

  async function handleEnroll() {
    setLoading(true);
    setError("");
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setEnrollmentId(data.id);
    setQrCode(data.totp.qr_code);
    setLoading(false);
  }

  async function handleVerify() {
    if (!enrollmentId) return;
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: enrollmentId,
      code: verifyCode,
    });

    if (error) {
      setError(error.message);
    } else {
      setQrCode(null);
      setEnrollmentId(null);
      setVerifyCode("");
      fetchFactors();
    }
    setLoading(false);
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

  const activeFactor = factors.find((f: any) => f.status === "verified");

  return (
    <div className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">Two-Factor Authentication</p>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        Add an extra layer of security to your account using TOTP (Google Authenticator, Authy, etc.).
      </p>

      {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}

      <div className="mt-6">
        {activeFactor ? (
          <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-4 border border-emerald-100">
            <div>
              <p className="text-sm font-bold text-emerald-700">MFA is Active</p>
              <p className="text-xs text-emerald-600 mt-1">Verified on {new Date(activeFactor.created_at).toLocaleDateString()}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => handleUnenroll(activeFactor.id)} disabled={loading}>
              Disable
            </Button>
          </div>
        ) : qrCode ? (
          <div className="space-y-4">
            <p className="text-sm font-bold text-slate-700">Scan QR Code</p>
            <div className="flex justify-center p-4 bg-slate-50 rounded-xl">
              <img src={qrCode} alt="QR Code" className="w-48 h-48" />
            </div>
            <div>
              <Label>Verification Code</Label>
              <Input
                placeholder="Enter 6-digit code"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleVerify} disabled={loading || verifyCode.length !== 6}>
                Verify & Activate
              </Button>
              <Button variant="ghost" onClick={() => setQrCode(null)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button onClick={handleEnroll} disabled={loading}>
            Enable Two-Factor Auth
          </Button>
        )}
      </div>
    </div>
  );
}
