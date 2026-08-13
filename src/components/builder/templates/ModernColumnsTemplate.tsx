import React from "react";
import type { ResumePreviewProps } from "../resume-preview-content";
import { cn } from "@/lib/utils";

function PreviewHeading({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <h3 className="text-[11px] font-black uppercase tracking-[0.28em]" style={{ color: accent }}>
      {children}
    </h3>
  );
}

export function ModernColumnsTemplate({ resume, template, isPrintMode }: ResumePreviewProps) {
  const fullName = [resume.personal.firstName, resume.personal.lastName].filter(Boolean).join(" ") || "Your Name";
  const accent = resume.style.accent || template.config_json.accent;

  return (
    <div 
      className={cn(
        "origin-top-left bg-white overflow-hidden min-h-full flex flex-col",
        isPrintMode ? "" : "shadow-[0_25px_60px_rgba(15,23,42,0.12)]"
      )}
      style={{ width: "210mm", minHeight: "297mm", fontSize: "0.95em" }}
      data-pdf-page="true"
      data-template-id={template.id}
      data-template-layout="modern-columns"
    >
      <div className="flex-1 px-8 py-10 md:px-12 space-y-12">
        <div className="text-center mb-12">
          {resume.personal.profilePhotoUrl && (
            <div className="mx-auto mb-6 h-32 w-32 overflow-hidden rounded-full border-4 shadow-xl" style={{ borderColor: accent }}>
              <img src={resume.personal.profilePhotoUrl} alt={fullName} className="h-full w-full object-cover" />
            </div>
          )}
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">{fullName}</h1>
          <p className="mt-2 text-[14px] font-bold uppercase tracking-widest" style={{ color: accent }}>
            {resume.personal.headline || resume.ats.targetRole}
          </p>
        </div>

        <div className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-b border-slate-100 pb-12">
            <div className="space-y-8">
              {resume.skills.length > 0 && (
                <div>
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
              <div>
                <PreviewHeading accent={accent}>Contact</PreviewHeading>
                <div className="mt-4 space-y-2 text-[11.5px] text-slate-600">
                  {resume.personal.email && <p>Email: {resume.personal.email}</p>}
                  {resume.personal.phone && <p>Phone: {resume.personal.phone}</p>}
                  {resume.personal.location && <p>Location: {resume.personal.location}</p>}
                </div>
              </div>
            </div>
            
            <div>
              {resume.projects.length > 0 && resume.projects.some(p => p.name) && (
                <div className="rounded-2xl border-2 p-6" style={{ borderColor: `${accent}20` }}>
                  <PreviewHeading accent={accent}>Projects</PreviewHeading>
                  <div className="mt-4 space-y-4">
                    {resume.projects.map(p => (
                      <div key={p.id}>
                        <p className="text-[13px] font-bold text-slate-900">{p.name}</p>
                        <p className="text-[11px] text-slate-500 mt-1 italic">{p.role}</p>
                        {p.highlights.length > 0 && (
                           <ul className="mt-2 ml-4 list-disc space-y-1 text-[11px] leading-5 text-slate-600">
                             {p.highlights.filter(Boolean).map((h, i) => (
                               <li key={i}>{h}</li>
                             ))}
                           </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-12">
            {resume.experience.length > 0 && (
              <div>
                <PreviewHeading accent={accent}>Experience</PreviewHeading>
                <div className="mt-4 space-y-5">
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

            {resume.education.length > 0 && (
              <div>
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
    </div>
  );
}
