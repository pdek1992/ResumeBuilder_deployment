import React from "react";
import type { ResumePreviewProps } from "../resume-preview-content";
import { cn } from "@/lib/utils";

function GridLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-300 md:pt-1">{children}</div>;
}

export function GridLabelsTemplate({ resume, template, isPrintMode }: ResumePreviewProps) {
  const fullName = [resume.personal.firstName, resume.personal.lastName].filter(Boolean).join(" ") || "Your Name";
  const accent = resume.style.accent || template.config_json.accent;

  return (
    <div 
      className={cn(
        "origin-top-left bg-white overflow-hidden min-h-full flex flex-col",
        isPrintMode ? "" : "shadow-[0_25px_60px_rgba(15,23,42,0.12)]"
      )}
      style={{ width: "210mm", minHeight: "297mm", fontSize: "1em" }}
      data-pdf-page="true"
      data-template-id={template.id}
      data-template-layout="grid-labels"
    >
      <div className="px-8 py-10 md:px-12 mb-8 bg-transparent">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-6">
              {resume.personal.profilePhotoUrl && (
                <div className="shrink-0 overflow-hidden shadow-2xl border-4 border-white h-24 w-24 rounded-3xl">
                  <img src={resume.personal.profilePhotoUrl} alt={fullName} className="h-full w-full object-cover" />
                </div>
              )}
              <div>
                <h1 className="font-display font-black leading-tight tracking-tight break-words text-slate-950 text-[32px]">{fullName}</h1>
                <p className="mt-2 font-bold uppercase tracking-widest break-words text-[12px]" style={{ color: accent }}>
                  {resume.personal.headline || resume.ats.targetRole || "Professional Headline"}
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t pt-6 text-[11px] font-medium tracking-wide border-slate-100 text-slate-500">
              {[resume.personal.location, resume.personal.phone, resume.personal.email].filter(Boolean).map((text, i) => (
                <span key={i} className="flex items-center gap-2">
                  {i > 0 && <span className="h-1 w-1 rounded-full bg-current opacity-30" />}
                  {text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-8 py-10 md:px-12 md:grid md:grid-cols-[160px_1fr] md:gap-x-12 md:gap-y-16 space-y-12 md:space-y-0">
        {resume.summary && (
          <div className="md:contents">
            <GridLabel>About</GridLabel>
            <div>
              <p className="leading-6 text-slate-600 whitespace-pre-wrap break-words text-[11.5px]">{resume.summary}</p>
            </div>
          </div>
        )}

        {resume.experience.length > 0 && (
          <div className="md:contents">
            <GridLabel>Experience</GridLabel>
            <div className="space-y-5">
              {resume.experience.map((item) => (
                <div key={item.id} className="relative break-inside-avoid">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[13px] font-black text-slate-900">{item.title || "Role Title"}</p>
                      <p className="mt-1 text-[11px] text-slate-500">{[item.company, item.location].filter(Boolean).join(" | ")}</p>
                    </div>
                    {(item.startDate || item.endDate || item.current) && (
                      <span className="shrink-0 rounded-full bg-slate-50 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-slate-400">
                        {[item.startDate, item.current ? "Present" : item.endDate].filter(Boolean).join(" - ")}
                      </span>
                    )}
                  </div>
                  <ul className="mt-2 ml-4 list-disc space-y-1 leading-5 text-slate-600 text-[11.5px]">
                    {item.highlights.filter(Boolean).map((highlight, index) => (
                      <li key={index} className="break-words whitespace-pre-wrap">{highlight}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {resume.projects.length > 0 && resume.projects.some(p => p.name) && (
          <div className="md:contents">
            <GridLabel>Projects</GridLabel>
            <div className="space-y-6">
              {resume.projects.map((item) => (
                <div key={item.id} className="group break-inside-avoid">
                  <p className="text-[14px] font-black text-slate-900">{item.name}</p>
                  {item.role && <p className="mt-1 text-[10.5px] font-bold uppercase tracking-wide text-slate-400">{item.role}</p>}
                  <div className="mt-2 space-y-2">
                    {item.highlights.filter(Boolean).map((highlight, index) => (
                      <p key={index} className="leading-relaxed text-slate-600 break-words whitespace-pre-wrap flex gap-3 text-[11.5px]">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-300" />
                        {highlight}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {resume.skills.length > 0 && (
          <div className="md:contents">
            <GridLabel>Skills</GridLabel>
            <div className="rounded-xl bg-slate-900 p-6 text-white w-full">
              <h3 className="text-[11px] font-black uppercase tracking-[0.28em] mb-4 text-white">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {resume.skills.map((skill) => (
                  <span key={skill} className="rounded-lg bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {resume.education.length > 0 && (
          <div className="md:contents">
            <GridLabel>Education</GridLabel>
            <div className="space-y-6">
              {resume.education.map(item => (
                <div key={item.id}>
                  <div className="flex justify-between items-start gap-4">
                    <p className="text-[13.5px] font-black leading-tight text-slate-950">{item.degree || "Degree"}</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] shrink-0 text-slate-400">{item.endDate}</p>
                  </div>
                  <p className="mt-1.5 text-[11.5px] font-bold uppercase tracking-wide text-slate-500">{item.school || "University"}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
