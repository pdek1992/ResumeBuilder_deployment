import React from "react";
import type { ResumePreviewProps } from "../resume-preview-content";
import { cn } from "@/lib/utils";

function PreviewHeading({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="h-6 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
      <h3 className="text-[11px] font-black uppercase tracking-[0.28em]" style={{ color: accent }}>{children}</h3>
    </div>
  );
}

export function ModularCardTemplate({ resume, template, isPrintMode }: ResumePreviewProps) {
  const fullName = [resume.personal.firstName, resume.personal.lastName].filter(Boolean).join(" ") || "Your Name";
  const accent = resume.style.accent || template.config_json.accent;

  return (
    <div 
      className={cn(
        "origin-top-left bg-white overflow-hidden min-h-full flex flex-col p-8 space-y-6",
        isPrintMode ? "" : "shadow-[0_25px_60px_rgba(15,23,42,0.12)]"
      )}
      style={{ width: "210mm", minHeight: "297mm", fontSize: "0.95em" }}
      data-pdf-page="true"
      data-template-id={template.id}
      data-template-layout="modular-card"
    >
      <div 
        className="px-8 py-10 md:px-12 rounded-[2.5rem] border shadow-sm"
        style={{ borderColor: accent, backgroundColor: "transparent" }}
      >
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-6">
              {resume.personal.profilePhotoUrl && (
                <div className="shrink-0 overflow-hidden shadow-2xl border-4 border-white rounded-3xl h-24 w-24">
                  <img src={resume.personal.profilePhotoUrl} alt={fullName} className="h-full w-full object-cover" />
                </div>
              )}
              <div>
                <h1 className="font-display text-4xl font-black leading-tight tracking-tight break-words text-slate-950">{fullName}</h1>
                <p className="mt-2 text-[14px] font-bold uppercase tracking-widest break-words" style={{ color: accent }}>
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
          {template.icon && !resume.personal.profilePhotoUrl && (
            <div className="hidden h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm md:flex">
              <img src={template.icon} alt="" className="h-12 w-12 contrast-125 opacity-100" />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6 flex-1">
        <div className="space-y-6">
          {resume.summary && (
            <div className="rounded-2xl border p-6" style={{ backgroundColor: `${accent}08`, borderColor: `${accent}20` }}>
              <PreviewHeading accent={accent}>Professional Summary</PreviewHeading>
              <p className="mt-3 leading-6 text-slate-600 whitespace-pre-wrap break-words">{resume.summary}</p>
            </div>
          )}

          {resume.experience.length > 0 && (
            <div className="rounded-2xl border p-6" style={{ backgroundColor: `${accent}08`, borderColor: `${accent}20` }}>
              <PreviewHeading accent={accent}>Experience</PreviewHeading>
              <div className="mt-4 space-y-5">
                {resume.experience.map((item) => (
                  <div key={item.id} className="relative break-inside-avoid rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
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
                    <ul className="mt-2 ml-4 list-disc space-y-1 leading-5 text-slate-600">
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
            <div className="rounded-3xl border p-8 shadow-sm" style={{ backgroundColor: `${accent}05`, borderColor: `${accent}15` }}>
              <PreviewHeading accent={accent}>Projects</PreviewHeading>
              <div className="mt-6 space-y-6">
                {resume.projects.map((item) => (
                  <div key={item.id} className="group break-inside-avoid">
                    <p className="text-[14px] font-black text-slate-900">{item.name}</p>
                    {item.role && <p className="mt-1 text-[10.5px] font-bold uppercase tracking-wide text-slate-400">{item.role}</p>}
                    <div className="mt-2 space-y-2">
                      {item.highlights.filter(Boolean).map((highlight, index) => (
                        <p key={index} className="leading-relaxed text-slate-600 break-words whitespace-pre-wrap flex gap-3">
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
        </div>

        <div className="space-y-6">
          {resume.skills.length > 0 && (
            <div className="rounded-2xl border p-6 bg-white shadow-sm border-slate-100">
              <PreviewHeading accent={accent}>Skills</PreviewHeading>
              <div className="mt-4 flex flex-wrap gap-2">
                {resume.skills.map((skill) => (
                  <span key={skill} className="rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ borderColor: `${accent}24`, backgroundColor: `${accent}10`, color: accent }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {resume.education.length > 0 && (
            <div className="rounded-3xl border p-8" style={{ backgroundColor: `${accent}05`, borderColor: `${accent}15` }}>
              <PreviewHeading accent={accent}>Education</PreviewHeading>
              <div className="mt-6 space-y-6">
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
    </div>
  );
}
