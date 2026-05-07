import type { ReactNode } from "react";
import { Eye } from "lucide-react";

import type { ResumeData, TemplateRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

type ResumePreviewProps = {
  resume: ResumeData;
  template: TemplateRecord;
  className?: string;
};

function PreviewHeading({ children }: { children: ReactNode }) {
  return <h3 className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-700">{children}</h3>;
}

export function ResumePreview({ resume, template, className }: ResumePreviewProps) {
  const fullName = [resume.personal.firstName, resume.personal.lastName].filter(Boolean).join(" ") || "Your Name";
  const accent = resume.style.accent || template.config_json.accent;
  const isSplit = template.config_json.columns === "split";

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
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Live Preview</p>
        </div>
        <div className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-[12px] font-black uppercase tracking-[0.24em] text-emerald-600">
          Page-by-Page View
        </div>
      </div>

      <div className="px-5 py-6 md:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="mx-auto aspect-[1/1.414] max-w-[760px] bg-white p-8 md:p-12">
            <div className="min-h-full rounded-[1.2rem] bg-white shadow-[0_25px_60px_rgba(15,23,42,0.12)]">
              <div className="px-8 py-7 text-white md:px-10" style={{ backgroundColor: template.config_json.headerBackground || accent }}>
                <h1 className="font-display text-[26px] font-black tracking-tight md:text-[30px]">{fullName}</h1>
                <p className="mt-2 text-[13px] opacity-95">{resume.personal.headline || resume.ats.targetRole || "Professional Headline"}</p>
                <p className="mt-3 text-[11px] opacity-90">
                  {[resume.personal.location, resume.personal.phone, resume.personal.email].filter(Boolean).join(" | ") || "Location | Phone | Email"}
                </p>
              </div>

              <div className={cn("grid gap-8 px-8 py-8 md:px-10", isSplit ? "md:grid-cols-[1.25fr_0.75fr]" : "grid-cols-1")}>
                <div className="space-y-8">
                  <div>
                    <PreviewHeading>Professional Summary</PreviewHeading>
                    <p className="mt-3 text-[12.5px] leading-6 text-slate-600">
                      {resume.summary || "This appears prominently in the preview and final PDF."}
                    </p>
                  </div>

                  <div>
                    <PreviewHeading>Experience</PreviewHeading>
                    <div className="mt-4 space-y-5">
                      {(resume.experience.filter((item) => item.title || item.company).length ? resume.experience : []).map((item) => (
                        <div key={item.id}>
                          <p className="text-[13px] font-black text-slate-900">{item.title || "Role Title"}</p>
                          <p className="mt-1 text-[11px] text-slate-500">{[item.company, item.location].filter(Boolean).join(" | ")}</p>
                          <ul className="mt-2 ml-4 list-disc space-y-1 text-[11.5px] leading-5 text-slate-600">
                            {item.highlights.filter(Boolean).map((highlight, index) => (
                              <li key={`${item.id}-${index}`}>{highlight}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  {resume.projects.some((item) => item.name) ? (
                    <div>
                      <PreviewHeading>Projects</PreviewHeading>
                      <div className="mt-4 space-y-4">
                        {resume.projects.map((item) => (
                          <div key={item.id}>
                            <p className="text-[13px] font-black text-slate-900">{item.name}</p>
                            {item.highlights.filter(Boolean).map((highlight, index) => (
                              <p key={`${item.id}-${index}`} className="mt-1 text-[11.5px] leading-5 text-slate-600">
                                {highlight}
                              </p>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-8 border-slate-200 md:border-l md:pl-8">
                  <div>
                    <PreviewHeading>Skills</PreviewHeading>
                    <ul className="mt-4 ml-4 list-disc space-y-1 text-[11.5px] leading-5 text-slate-600">
                      {resume.skills.length > 0 ? resume.skills.map((skill) => <li key={skill}>{skill}</li>) : <li>Key skills appear here</li>}
                    </ul>
                  </div>

                  <div>
                    <PreviewHeading>Education</PreviewHeading>
                    <div className="mt-4 space-y-3">
                      {resume.education.filter((item) => item.school || item.degree).length > 0 ? (
                        resume.education.map((item) => (
                          <div key={item.id}>
                            <p className="text-[12px] font-black text-slate-900">{item.degree || "Degree"}</p>
                            <p className="mt-1 text-[11px] text-slate-500">{item.school || "Institution"}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11.5px] text-slate-500">Education details appear here.</p>
                      )}
                    </div>
                  </div>

                  {resume.certifications.some((item) => item.name) ? (
                    <div>
                      <PreviewHeading>Certifications</PreviewHeading>
                      <div className="mt-4 space-y-2">
                        {resume.certifications.map((item) => (
                          <p key={item.id} className="text-[11.5px] leading-5 text-slate-600">
                            {item.name}
                          </p>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-1 pb-1 pt-5">
          <div className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Preview</div>
          <div className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Page 1</div>
          <div className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Ready for Export</div>
          <div className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">ATS Optimized Structure</div>
        </div>
      </div>
    </section>
  );
}
