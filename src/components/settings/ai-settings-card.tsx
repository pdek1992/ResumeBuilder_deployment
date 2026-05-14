"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AISettingsCard({ initialConfig }: { initialConfig: Record<string, any> }) {
  const [geminiApiKey, setGeminiApiKey] = useState(initialConfig.geminiApiKey ?? "");
  const [openAiApiKey, setOpenAiApiKey] = useState(initialConfig.openAiApiKey ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSave() {
    setLoading(true);
    setMessage(null);

    try {
      await apiFetch("/api/account/ai-settings", {
        method: "POST",
        body: JSON.stringify({
          geminiApiKey,
          openAiApiKey,
        }),
      });
      setMessage({ type: "success", text: "AI settings updated successfully" });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to update AI settings",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">AI Integration</p>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        Configure your own AI provider keys to override the default system limits. Leave empty to use system defaults.
      </p>
      
      <div className="mt-6 space-y-6">
        <div>
          <Label>Gemini API Key</Label>
          <Input
            type="password"
            placeholder="Paste your Gemini API key here"
            value={geminiApiKey}
            onChange={(e) => setGeminiApiKey(e.target.value)}
          />
          <p className="mt-2 text-xs text-slate-400">
            Used for PDF parsing, analysis, and conversational editing.
          </p>
        </div>

        <div>
          <Label>OpenAI API Key</Label>
          <Input
            type="password"
            placeholder="Paste your OpenAI API key here"
            value={openAiApiKey}
            onChange={(e) => setOpenAiApiKey(e.target.value)}
          />
          <p className="mt-2 text-xs text-slate-400">
            Alternative provider for AI features.
          </p>
        </div>
      </div>

      {message ? (
        <p className={`mt-4 text-sm ${message.type === "success" ? "text-emerald-600" : "text-rose-600"}`}>
          {message.text}
        </p>
      ) : null}

      <Button className="mt-6" onClick={handleSave} disabled={loading}>
        {loading ? "Saving..." : "Save AI Settings"}
      </Button>
    </div>
  );
}
