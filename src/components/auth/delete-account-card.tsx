"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { apiFetch } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DeleteAccountCard({ requiresPassword }: { requiresPassword: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmationText, setConfirmationText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    setError("");

    try {
      await apiFetch("/api/account/delete", {
        method: "POST",
        body: JSON.stringify({
          password,
          confirmationText,
        }),
      });
      router.push("/");
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete account");
      setLoading(false);
    }
  }

  return (
    <div className="mt-10 rounded-[2rem] border border-rose-200 bg-rose-50 p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-rose-600">Delete Account</p>
      <p className="mt-3 text-sm leading-6 text-rose-700">
        This permanently removes resumes, resume versions, AI content, and support data. Payment records are retained for audit and fraud prevention.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {requiresPassword ? (
          <div>
            <Label>Password Validation</Label>
            <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>
        ) : null}
        <div>
          <Label>Type DELETE to Confirm</Label>
          <Input value={confirmationText} onChange={(event) => setConfirmationText(event.target.value)} />
        </div>
      </div>
      {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
      <Button className="mt-5" variant="danger" onClick={handleDelete} disabled={loading}>
        {loading ? "Deleting Account" : "Delete Account"}
      </Button>
    </div>
  );
}
