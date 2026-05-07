"use client";

import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { apiFetch } from "@/lib/client-api";
import type { TemplateRecord } from "@/lib/types";

export function TemplateSelector({
  resumeId,
  templates,
  selectedTemplateId,
}: {
  resumeId: string;
  templates: TemplateRecord[];
  selectedTemplateId: string;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleSelect(templateId: string) {
    setPendingId(templateId);
    setError("");

    try {
      await apiFetch("/api/resumes/save", {
        method: "POST",
        body: JSON.stringify({
          resumeId,
          templateId,
          currentDraftState: {
            selectedAt: new Date().toISOString(),
          },
        }),
      });
      router.push(`/builder/${resumeId}`);
      router.refresh();
    } catch (selectionError) {
      setError(selectionError instanceof Error ? selectionError.message : "Unable to update template");
      setPendingId(null);
    }
  }

  return (
    <section className="rounded-[3rem] border border-white/70 bg-white/82 px-6 py-8 shadow-[0_30px_80px_rgba(37,99,235,0.12)] backdrop-blur md:px-10 md:py-10">
      <p className="text-[12px] font-black uppercase tracking-[0.32em] text-primary">Step 3: Visuals</p>
      <button
        type="button"
        onClick={() => router.back()}
        className="mt-6 inline-flex items-center gap-2 text-[13px] font-black uppercase tracking-[0.22em] text-slate-500"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>
      <h1 className="mt-5 font-display text-[3rem] font-black leading-none tracking-tight text-slate-950 md:text-[4.3rem]">
        Choose Your Style
      </h1>
      <p className="mt-5 max-w-3xl text-[18px] leading-9 text-slate-500">
        Select a template that matches your industry. You can change colors and fonts later in the editor.
      </p>

      {error ? <p className="mt-6 text-sm text-rose-600">{error}</p> : null}

      <div className="mt-10 space-y-8">
        {templates.map((template) => {
          const active = template.id === selectedTemplateId;

          return (
            <button
              key={template.id}
              type="button"
              onClick={() => handleSelect(template.id)}
              disabled={pendingId !== null}
              className="block w-full rounded-[2.8rem] border border-slate-100 bg-white p-5 text-left shadow-[0_18px_40px_rgba(15,23,42,0.05)] transition hover:shadow-[0_24px_58px_rgba(15,23,42,0.08)] disabled:opacity-70"
            >
              <div className="rounded-[2.2rem] border border-slate-100 bg-white p-5">
                <div className="overflow-hidden rounded-[1.8rem] border border-slate-100 bg-[#fbfdff] p-4 shadow-[inset_0_0_40px_rgba(148,163,184,0.08)]">
                  <Image
                    src={template.preview_image}
                    alt={template.template_name}
                    width={900}
                    height={1200}
                    className="mx-auto h-auto w-full max-w-[620px]"
                  />
                </div>
              </div>
              <div className="px-4 pb-2 pt-8 text-center">
                <h3 className="font-display text-[2.1rem] font-black tracking-tight text-slate-950">{template.template_name}</h3>
                <p className="mt-3 text-[12px] font-black uppercase tracking-[0.24em] text-slate-400">
                  {pendingId === template.id ? "Applying Template" : active ? "Current Template" : "Select Template"}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
