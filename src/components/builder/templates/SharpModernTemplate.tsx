import React from "react";
import type { ResumePreviewProps } from "../resume-preview-content";
import { cn } from "@/lib/utils";

function SectionDivider({ accent }: { accent: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="h-[2px] flex-1 bg-slate-200" />
      <div className="h-2 w-2 rotate-45" style={{ backgroundColor: accent }} />
    </div>
  );
}

function PreviewHeading({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <div className="mb-2">
      <h3 className="text-[13px] font-black uppercase tracking-[0.2em]" style={{ color: accent }}>{children}</h3>
      <SectionDivider accent={accent} />
    </div>
  );
}

export function SharpModernTemplate({ resume, template, isPrintMode }: ResumePreviewProps) {
  const fullName = [resume.personal.firstName, resume.personal.lastName].filter(Boolean).join(" ") || "Your Name";
  const accent = resume.style.accent || template.config_json.accent;
  
  return (
    <div 
      className={cn(
        "origin-top-left bg-white overflow-hidden min-h-full flex flex-col font-mono text-slate-800",
        isPrintMode ? "" : "shadow-[0_25px_60px_rgba(15,23,42,0.12)]"
      )}
      style={{ width: "210mm", minHeight: "297mm", fontSize: "1em", WebkitPrintColorAdjust: "exact" }}
      data-pdf-page="true"
      data-template-id={template.id}
      data-template-layout="sharp-modern"
    >
      <div className="flex px-10 py-10 gap-8 items-center bg-slate-50 border-b border-slate-200" style={{ WebkitPrintColorAdjust: "exact" }}>
        {resume.personal.profilePhotoUrl && (
          <div className="shrink-0 h-28 w-28 overflow-hidden rounded-none border-2 shadow-sm" style={{ borderColor: accent }}>
            <img src={resume.personal.profilePhotoUrl} alt={fullName} className="h-full w-full object-cover" />
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-4xl font-black tracking-tight" style={{ color: accent }}>{fullName}</h1>
          <p className="mt-2 text-[14px] font-bold uppercase tracking-[0.1em] text-slate-600">{resume.personal.headline || resume.ats.targetRole}</p>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[11px] font-medium text-slate-500">
            {resume.personal.location && <span className="flex items-center gap-1">📍 {resume.personal.location}</span>}
            {resume.personal.email && <span className="flex items-center gap-1">✉️ {resume.personal.email}</span>}
            {resume.personal.phone && <span className="flex items-center gap-1">📞 {resume.personal.phone}</span>}
            {resume.personal.linkedIn && <span className="flex items-center gap-1">in/ {resume.personal.linkedIn.replace(/https?:\/\/(www\.)?linkedin\.com\/in\//, '')}</span>}
            {resume.personal.github && <span className="flex items-center gap-1">gh/ {resume.personal.github.replace(/https?:\/\/(www\.)?github\.com\//, '')}</span>}
          </div>
        </div>
      </div>

      <div className="flex-1 flex px-10 py-8 gap-8">
        <div className="flex-1 space-y-8">
          {resume.summary && (
            <div>
              <PreviewHeading accent={accent}>Profile</PreviewHeading>
              <p className="text-[12px] leading-relaxed text-slate-600 whitespace-pre-wrap break-words">{resume.summary}</p>
            </div>
          )}

          {resume.experience.length > 0 && (
            <div>
              <PreviewHeading accent={accent}>Experience</PreviewHeading>
              <div className="space-y-6">
                {resume.experience.map((item) => (
                  <div key={item.id} className="break-inside-avoid">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <p className="text-[13px] font-bold text-slate-900">{item.title || "Role Title"}</p>
                        <p className="mt-0.5 text-[12px] font-medium text-slate-700">{item.company || "Company Name"}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          {[item.startDate, item.current ? "Present" : item.endDate].filter(Boolean).join(" - ")}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-400">{item.location}</p>
                      </div>
                    </div>
                    <ul className="mt-3 ml-4 list-square space-y-1.5 text-[12px] leading-relaxed text-slate-600">
                      {item.highlights.filter(Boolean).map((highlight, index) => (
                        <li key={index} className="pl-1 marker:text-slate-400 break-words whitespace-pre-wrap">{highlight}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {resume.projects.length > 0 && resume.projects.some(p => p.name) && (
            <div>
              <PreviewHeading accent={accent}>Projects</PreviewHeading>
              <div className="space-y-6">
                {resume.projects.map((item) => (
                  <div key={item.id} className="break-inside-avoid">
                    <div className="flex items-baseline justify-between gap-4">
                      <div className="flex items-baseline gap-2">
                        <p className="text-[13px] font-bold text-slate-900">{item.name}</p>
                        {item.role && <span className="text-[11px] font-medium text-slate-500">| {item.role}</span>}
                      </div>
                      {item.link && (
                        <a href={item.link} className="text-[10px] underline shrink-0" style={{ color: accent }}>Link</a>
                      )}
                    </div>
                    <div className="mt-2 text-[12px] leading-relaxed text-slate-600">
                      <ul className="ml-4 list-square space-y-1.5">
                        {item.highlights.filter(Boolean).map((highlight, index) => (
                          <li key={index} className="pl-1 marker:text-slate-400 break-words whitespace-pre-wrap">{highlight}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="w-1/3 shrink-0 space-y-8">
          {resume.education.length > 0 && (
            <div>
              <PreviewHeading accent={accent}>Education</PreviewHeading>
              <div className="space-y-4">
                {resume.education.map((item) => (
                  <div key={item.id} className="break-inside-avoid">
                    <p className="text-[12px] font-bold text-slate-900">{item.degree}</p>
                    <p className="mt-0.5 text-[11px] text-slate-700">{item.school}</p>
                    <div className="mt-1 flex justify-between text-[10px] text-slate-500">
                      <span>{item.endDate}</span>
                      <span>{item.location}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {resume.skills.length > 0 && (
            <div>
              <PreviewHeading accent={accent}>Skills</PreviewHeading>
              <div className="flex flex-wrap gap-1.5">
                {resume.skills.map((skill) => (
                  <span key={skill} className="px-2 py-1 text-[10.5px] font-bold border rounded-sm" style={{ borderColor: `${accent}30`, backgroundColor: `${accent}05`, color: accent }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {resume.certifications && resume.certifications.length > 0 && (
            <div>
              <PreviewHeading accent={accent}>Certifications</PreviewHeading>
              <div className="space-y-4">
                {resume.certifications.map((cert) => (
                  <div key={cert.id} className="break-inside-avoid">
                    <p className="text-[12px] font-bold text-slate-900">{cert.name}</p>
                    <p className="mt-0.5 text-[11px] text-slate-700">{cert.issuer}</p>
                    <div className="mt-1 flex justify-between text-[10px] text-slate-500">
                      <span>{cert.issuedOn}</span>
                    </div>
                    {cert.credentialId && <p className="mt-0.5 text-[9px] text-slate-400">ID: {cert.credentialId}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {resume.more && resume.more.length > 0 && (
            <div>
              <PreviewHeading accent={accent}>Additional</PreviewHeading>
              <div className="space-y-3">
                {resume.more.map((item) => (
                  <div key={item.id} className="break-inside-avoid">
                    <p className="text-[11px] font-bold text-slate-900 uppercase tracking-wide">{item.label}</p>
                    <p className="mt-0.5 text-[12px] text-slate-600 whitespace-pre-wrap">{item.value}</p>
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
