import React from "react";
import type { ResumePreviewProps } from "../resume-preview-content";
import { cn } from "@/lib/utils";

function PreviewHeading({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <div className="mb-4 bg-slate-900 px-4 py-2">
      <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-white">{children}</h3>
    </div>
  );
}

export function SleekDarkTemplate({ resume, template, isPrintMode }: ResumePreviewProps) {
  const fullName = [resume.personal.firstName, resume.personal.lastName].filter(Boolean).join(" ") || "Your Name";
  const accent = resume.style.accent || template.config_json.accent;
  
  return (
    <div 
      className={cn(
        "origin-top-left bg-slate-50 overflow-hidden min-h-full flex flex-col",
        isPrintMode ? "" : "overflow-hidden shadow-[0_25px_60px_rgba(15,23,42,0.12)]"
      )}
      style={{ width: "210mm", minHeight: "297mm", fontSize: "1em" }}
      data-pdf-page="true"
      data-template-id={template.id}
      data-template-layout="sleek-dark"
    >
      <div className="px-12 py-12 text-center text-white" style={{ backgroundColor: accent }}>
        {resume.personal.profilePhotoUrl && (
          <div className="mx-auto mb-6 h-32 w-32 overflow-hidden rounded-full border-4 border-white/30 shadow-2xl">
            <img src={resume.personal.profilePhotoUrl} alt={fullName} className="h-full w-full object-cover" />
          </div>
        )}
        <h1 className="text-4xl font-black tracking-tight">{fullName}</h1>
        <p className="mt-4 text-[14px] font-bold uppercase tracking-[0.4em] text-white/70">{resume.personal.headline || resume.ats.targetRole}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-2 text-[11px] font-medium text-white/60">
          {resume.personal.location && <span>{resume.personal.location}</span>}
          {resume.personal.email && <span>{resume.personal.email}</span>}
          {resume.personal.phone && <span>{resume.personal.phone}</span>}
        </div>
      </div>

      <div className="flex-1 px-8 py-10 md:px-12 space-y-12">
        {resume.summary && (
          <div>
            <PreviewHeading accent={accent}>Professional Summary</PreviewHeading>
            <p className="mt-3 leading-6 text-slate-600 whitespace-pre-wrap break-words">{resume.summary}</p>
          </div>
        )}

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
                      <span className="shrink-0 rounded-full bg-slate-200 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-slate-600">
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
            <div className="mt-4 space-y-5">
              {resume.education.map(item => (
                <div key={item.id} className="relative break-inside-avoid">
                  <div className="flex justify-between items-start gap-4">
                    <p className="text-[13px] font-black text-slate-900">{item.degree || "Degree"}</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 shrink-0">{item.endDate}</p>
                  </div>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">{item.school || "University"}</p>
                </div>
              ))}
            </div>
          </div>
        )}

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

        {resume.projects.length > 0 && resume.projects.some(p => p.name) && (
          <div>
            <PreviewHeading accent={accent}>Projects</PreviewHeading>
            <div className="mt-4 space-y-5">
              {resume.projects.map((item) => (
                <div key={item.id} className="group break-inside-avoid">
                  <p className="break-words text-[14px] font-black text-slate-900">{item.name}</p>
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
    </div>
  );
}
