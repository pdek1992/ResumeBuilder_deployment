"use client";

import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

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
    <section className="rounded-[4rem] border border-white/80 bg-white/40 p-8 backdrop-blur-3xl md:p-12">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-primary/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
              {templates.length} Premium Designs
            </span>
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          </div>
          <h1 className="mt-4 font-display text-[3rem] font-black leading-none tracking-tight text-slate-950 md:text-[4.5rem]">
            Elite <span className="text-primary">Library</span>
          </h1>
          <p className="mt-6 text-[16px] text-slate-500 max-w-lg leading-relaxed">
            Choose a visual strategy that aligns with your target role. Each template is engineered for maximum ATS readability and visual impact.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.back()}
          className="group flex items-center gap-3 rounded-full border border-slate-200 bg-white px-8 py-4 text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 transition hover:border-primary hover:text-primary shadow-sm"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Return to Editor
        </button>
      </div>

      {error ? (
        <div className="mt-8 rounded-2xl bg-rose-50 px-6 py-4 text-[13px] font-bold text-rose-600">
          {error}
        </div>
      ) : null}

      <div className="mt-16 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {templates.map((template) => {
          const active = template.id === selectedTemplateId;
          const isPending = pendingId === template.id;

          return (
            <button
              key={template.id}
              type="button"
              onClick={() => handleSelect(template.id)}
              disabled={pendingId !== null}
              className={cn(
                "group relative block w-full transition-all duration-500",
                pendingId !== null && !isPending && "opacity-40 grayscale"
              )}
            >
              <div className={cn(
                "relative aspect-[1/1.414] overflow-hidden rounded-[3rem] border-4 transition-all duration-700",
                active 
                  ? "border-primary shadow-[0_40px_100px_rgba(37,99,235,0.25)] scale-[1.02]" 
                  : "border-white bg-white shadow-[0_20px_50px_rgba(15,23,42,0.06)] group-hover:border-primary/20 group-hover:shadow-[0_40px_80px_rgba(15,23,42,0.12)] group-hover:-translate-y-4"
              )}>
                <Image
                  src={template.preview_image}
                  alt={template.template_name}
                  fill
                  className={cn(
                    "object-cover transition-transform duration-1000 group-hover:scale-110",
                    isPending && "animate-pulse brightness-75"
                  )}
                />
                
                {active && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary/90 to-transparent p-8 pt-16">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Active Choice</p>
                  </div>
                )}
                
                <div className={cn(
                  "absolute inset-0 flex items-center justify-center bg-slate-950/40 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100",
                  active && "hidden"
                )}>
                  <div className="rounded-full bg-white px-8 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-950 shadow-2xl">
                    {isPending ? "Applying Style..." : "Select Template"}
                  </div>
                </div>
              </div>

              <div className="mt-8 text-left">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-display text-[1.6rem] font-black tracking-tight text-slate-950 group-hover:text-primary transition-colors">{template.template_name}</h3>
                  {template.icon && (
                    <img src={template.icon} alt="" className="h-6 w-6 opacity-30 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-3">
                  {template.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">{tag}</span>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
