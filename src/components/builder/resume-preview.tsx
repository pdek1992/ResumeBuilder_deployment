"use client";

import { useEffect, useRef, useState } from "react";
import { ResumePreviewContent } from "./resume-preview-content";
import { cn } from "@/lib/utils";
import type { ResumePreviewProps } from "./resume-preview-content";
import { Eye } from "lucide-react";

export function ResumePreview(props: ResumePreviewProps) {
  const { resume, template, className, isPrintMode } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const layout = template.config_json.layout || "standard";

  useEffect(() => {
    if (isPrintMode) return;
    
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const targetWidthPx = 794; 
        setScale(containerWidth / targetWidthPx);
      }
    };
    
    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, [isPrintMode]);

  if (isPrintMode) {
    return <ResumePreviewContent {...props} />;
  }

  return (
    <section
      data-print-hide-preview="true"
      className={cn("rounded-[3rem] border border-white/70 bg-white/82 shadow-[0_30px_80px_rgba(37,99,235,0.12)] backdrop-blur", className)}
    >
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5 md:px-8">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
            <Eye className="h-5 w-5 text-slate-700" />
          </span>
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Elite Preview</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600">
          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          Fidelity Active
        </div>
      </div>

      <div className="px-5 py-6 md:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-slate-100 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div ref={containerRef} className="mx-auto w-full relative bg-white shadow-2xl overflow-y-auto max-h-[80vh]">
            <div style={{
              width: "210mm",
              minHeight: "297mm",
              transform: `scale(${scale})`,
              transformOrigin: "top left"
            }}>
              <ResumePreviewContent {...props} />
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{template.template_name}</span>
          </div>
          <div className="flex gap-6">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">PDF FIDELITY: 100%</span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">LAYOUT: {layout.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
