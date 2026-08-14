import React from "react";
import type { ResumePreviewProps } from "../resume-preview-content";
import { cn } from "@/lib/utils";

function PreviewHeading({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <h3 className="text-[11px] font-black uppercase tracking-[0.28em] mb-4" style={{ color: accent , WebkitPrintColorAdjust: "exact" }}>
      {children}
    </h3>
  );
}

export function UltraCleanTemplate({ resume, template, isPrintMode }: ResumePreviewProps) {
  const fullName = [resume.personal.firstName, resume.personal.lastName].filter(Boolean).join(" ") || "Your Name";
  const accent = resume.style.accent || template.config_json.accent;

  return (
    <div 
      className={cn(
        "origin-top-left bg-white min-h-full",
        isPrintMode ? "" : "overflow-hidden shadow-[0_25px_60px_rgba(15,23,42,0.12)]"
      )}
      style={{ width: "210mm", minHeight: "297mm", fontSize: "1em" }}
      data-pdf-page="true"
      data-template-id={template.id}
      data-template-layout="ultra-clean"
    >
      <div className="px-8 py-8 md:px-12 border-b border-slate-100 flex justify-between items-end mb-8 bg-transparent">
        <div>
          <h1 className="text-[28px] font-black tracking-tight text-slate-900">{fullName}</h1>
          <p className="mt-1 text-[12px] font-bold uppercase tracking-widest" style={{ color: accent }}>
            {resume.personal.headline || resume.ats.targetRole}
          </p>
        </div>
        <div className="text-right space-y-1 text-[11px] font-medium text-slate-500">
          {resume.personal.email && <p>{resume.personal.email}</p>}
          {resume.personal.phone && <p>{resume.personal.phone}</p>}
          {resume.personal.location && <p>{resume.personal.location}</p>}
        </div>
      </div>

      <div className="flex-1 px-8 py-10 md:px-12 space-y-7">
        {resume.summary && (
          <div>
            <PreviewHeading accent={accent}>Professional Summary</PreviewHeading>
            <p className="mt-3 leading-6 text-slate-600 whitespace-pre-wrap break-words text-[11.5px]">{resume.summary}</p>
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

        {resume.education.length > 0 && (
          <div>
            <PreviewHeading accent={accent}>Education</PreviewHeading>
            <div className="mt-4 space-y-5">
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

        {resume.skills.length > 0 && (
          <div>
            <PreviewHeading accent={accent}>Skills</PreviewHeading>
            <div className="mt-4">
              <p className="text-[11.5px] leading-6 text-slate-600">{resume.skills.join(" / ")}</p>
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
                  {item.link && <a href={item.link} className="mt-1 text-[10px] underline text-slate-400 block">{item.link}</a>}
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
      
          {resume.certifications && resume.certifications.length > 0 && (
            <div className="mt-6">
              <PreviewHeading accent={accent}>Certifications</PreviewHeading>
              <div className="mt-4 space-y-4">
                {resume.certifications.map((cert) => (
                  <div key={cert.id} className="break-inside-avoid">
                    <p className="text-[13px] font-black text-slate-900">{cert.name}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{cert.issuer}</p>
                    <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                      <span>{cert.issuedOn}</span>
                      {cert.credentialId && <span>ID: {cert.credentialId}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {resume.more && resume.more.length > 0 && (
            <div className="mt-6">
              <PreviewHeading accent={accent}>Additional Info</PreviewHeading>
              <div className="mt-4 space-y-4">
                {resume.more.map((item) => (
                  <div key={item.id} className="break-inside-avoid">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-900">{item.label}</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-slate-600 whitespace-pre-wrap">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
</div>
    </div>
  );
}
