import type { ReactNode } from "react";
import { Eye } from "lucide-react";

import type { ResumeData, TemplateRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

type ResumePreviewProps = {
  resume: ResumeData;
  template: TemplateRecord;
  className?: string;
  isPrintMode?: boolean;
};

function PreviewHeading({ children, accent }: { children: ReactNode; accent: string }) {
  return <h3 className="text-[11px] font-black uppercase tracking-[0.28em]" style={{ color: accent }}>{children}</h3>;
}

export function ResumePreview({ resume, template, className, isPrintMode }: ResumePreviewProps) {
  const fullName = [resume.personal.firstName, resume.personal.lastName].filter(Boolean).join(" ") || "Your Name";
  const accent = resume.style.accent || template.config_json.accent;
  const layout = template.config_json.layout || "standard";
  const isSplit = template.config_json.columns === "split";

  const renderPersonal = () => (
    <div className={cn(
      "px-8 py-10 text-white md:px-12",
      layout === "banner-soft" && "rounded-b-[3rem] shadow-2xl",
      layout === "sidebar-dark" && "bg-transparent !text-slate-900 !px-0 !py-0",
      layout === "modular-card" && "rounded-[2.5rem] !text-slate-900 border border-slate-100 shadow-sm mb-8",
      !layout.includes("sidebar") && "mb-8"
    )} style={{ 
      backgroundColor: (layout === "sidebar-dark" || layout === "modular-card") ? "transparent" : (template.config_json.headerBackground || accent),
      borderColor: layout === "modular-card" ? template.config_json.headerBackground : undefined
    }}>
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1">
          <h1 className={cn(
            "font-display text-[32px] font-black leading-tight tracking-tight break-words md:text-[42px]",
            (layout === "sidebar-dark" || layout === "modular-card") ? "text-slate-950" : "text-white"
          )}>{fullName}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
            <p className={cn(
              "text-[14px] font-bold uppercase tracking-widest break-words",
              (layout === "sidebar-dark" || layout === "modular-card") ? "text-primary" : "text-white/90"
            )}>{resume.personal.headline || resume.ats.targetRole || "Professional Headline"}</p>
          </div>
          <div className={cn(
            "mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t pt-6 text-[11px] font-medium tracking-wide",
            (layout === "sidebar-dark" || layout === "modular-card") ? "border-slate-100 text-slate-500" : "border-white/10 text-white/70"
          )}>
            {[resume.personal.location, resume.personal.phone, resume.personal.email].filter(Boolean).map((text, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span className="h-1 w-1 rounded-full bg-current opacity-30" />}
                {text}
              </span>
            ))}
          </div>
        </div>
        {template.icon && layout !== "sidebar-dark" && (
          <div className="hidden h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-sm md:flex">
            <img src={template.icon} alt="" className={cn("h-14 w-14 contrast-125", (layout === "modular-card" ? "opacity-100" : "opacity-40 invert brightness-0"))} />
          </div>
        )}
      </div>
    </div>
  );

  const renderSummary = () => (
    <div className={cn(layout === "modular-card" && "rounded-2xl border border-slate-100 bg-slate-50/50 p-6")}>
      <PreviewHeading accent={accent}>Professional Summary</PreviewHeading>
      <p className="mt-3 text-[12.5px] leading-6 text-slate-600 whitespace-pre-wrap break-words">
        {resume.summary || "This appears prominently in the preview and final PDF."}
      </p>
    </div>
  );

  const renderExperience = () => (
    <div className={cn(layout === "modular-card" && "rounded-2xl border border-slate-100 bg-slate-50/50 p-6")}>
      <PreviewHeading accent={accent}>Experience</PreviewHeading>
      <div className="mt-4 space-y-5">
        {(resume.experience.filter((item) => item.title || item.company).length ? resume.experience : []).map((item) => (
          <div key={item.id} className="relative">
            {layout === "sidebar-circles" && (
              <div className="absolute -left-6 top-1 h-3 w-3 rounded-full" style={{ backgroundColor: accent }} />
            )}
            <p className="text-[13px] font-black text-slate-900">{item.title || "Role Title"}</p>
            <p className="mt-1 text-[11px] text-slate-500">{[item.company, item.location].filter(Boolean).join(" | ")}</p>
            <ul className="mt-2 ml-4 list-disc space-y-1 text-[11.5px] leading-5 text-slate-600">
              {item.highlights.filter(Boolean).map((highlight, index) => (
                <li key={`${item.id}-${index}`} className="break-words whitespace-pre-wrap">{highlight}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSkills = () => (
    <div className={cn(layout === "grid-labels" && "rounded-xl bg-slate-900 p-6 text-white")}>
      <PreviewHeading accent={layout === "grid-labels" ? "#fff" : accent}>Skills</PreviewHeading>
      <div className={cn("mt-4", layout === "grid-labels" ? "flex flex-wrap gap-2" : "space-y-1")}>
        {resume.skills.length > 0 ? (
          resume.skills.map((skill) => (
            <div key={skill} className={cn(
              layout === "grid-labels" ? "rounded-lg bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase" : "flex items-center gap-2 text-[11.5px] text-slate-600"
            )}>
              {layout !== "grid-labels" && <span className="h-1 w-1 rounded-full" style={{ backgroundColor: accent }} />}
              {skill}
            </div>
          ))
        ) : (
          <p className="text-[11.5px] text-slate-400">Key skills appear here</p>
        )}
      </div>
    </div>
  );

  const innerContent = (
    <div className={cn(
      isPrintMode ? "w-full min-h-[297mm] bg-white overflow-hidden" : "min-h-full overflow-hidden rounded-[1.2rem] bg-white shadow-[0_25px_60px_rgba(15,23,42,0.12)]",
      layout === "sidebar-dark" && "flex"
    )}>
      {layout === "sidebar-dark" && (
        <div className="w-[30%] shrink-0 p-8 text-white" style={{ backgroundColor: template.config_json.sidebarTint || accent }}>
                  <div className="mb-8">
                    <img src={template.icon || "/icons/icon-resume.png"} alt="Icon" className="h-12 w-12 opacity-40 brightness-0 invert" />
                  </div>
                  <div className="space-y-8">
                    {renderSkills()}
                    <div>
                      <PreviewHeading accent="#fff">Education</PreviewHeading>
                      <div className="mt-4 space-y-4">
                        {resume.education.map(item => (
                          <div key={item.id}>
                            <p className="text-[11px] font-bold">{item.degree}</p>
                            <p className="text-[10px] opacity-70">{item.school}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex-1">
                {renderPersonal()}
                
                <div className={cn("grid gap-8 px-8 py-8 md:px-10", isSplit && layout !== "sidebar-dark" ? "md:grid-cols-[1.25fr_0.75fr]" : "grid-cols-1")}>
                  <div className="space-y-8">
                    {renderSummary()}
                    {renderExperience()}

                    {resume.projects.some((item) => item.name) && (
                      <div className={cn(layout === "modular-card" && "rounded-2xl border border-slate-100 bg-slate-50/50 p-6")}>
                        <PreviewHeading accent={accent}>Projects</PreviewHeading>
                        <div className="mt-4 space-y-4">
                          {resume.projects.map((item) => (
                            <div key={item.id}>
                              <p className="text-[13px] font-black text-slate-900">{item.name}</p>
                              {item.highlights.filter(Boolean).map((highlight, index) => (
                                <p key={index} className="mt-1 text-[11.5px] leading-5 text-slate-600 break-words whitespace-pre-wrap">{highlight}</p>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {resume.volunteer?.some((item) => item.organization) && (
                      <div className={cn(layout === "modular-card" && "rounded-2xl border border-slate-100 bg-slate-50/50 p-6")}>
                        <PreviewHeading accent={accent}>Volunteer Experience</PreviewHeading>
                        <div className="mt-4 space-y-5">
                          {resume.volunteer.map((item) => (
                            <div key={item.id}>
                              <p className="text-[13px] font-black text-slate-900">{item.role || "Role"}</p>
                              <p className="mt-1 text-[11px] text-slate-500">{[item.organization, [item.startDate, item.endDate].filter(Boolean).join(" — ")].filter(Boolean).join(" | ")}</p>
                              <ul className="mt-2 ml-4 list-disc space-y-1 text-[11.5px] leading-5 text-slate-600">
                                {item.highlights.filter(Boolean).map((highlight, index) => (
                                  <li key={`${item.id}-${index}`} className="break-words whitespace-pre-wrap">{highlight}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {!isSplit && (
                      <>
                        {renderSkills()}
                        <div className={cn(layout === "modular-card" && "rounded-2xl border border-slate-100 bg-slate-50/50 p-6")}>
                          <PreviewHeading accent={accent}>Education</PreviewHeading>
                          <div className="mt-4 space-y-3">
                            {resume.education.map(item => (
                              <div key={item.id}>
                                <p className="text-[12px] font-black text-slate-900">{item.degree}</p>
                                <p className="mt-1 text-[11px] text-slate-500">{item.school}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        {resume.certifications.some((item) => item.name) && (
                          <div className={cn(layout === "modular-card" && "rounded-2xl border border-slate-100 bg-slate-50/50 p-6")}>
                            <PreviewHeading accent={accent}>Certifications</PreviewHeading>
                            <div className="mt-4 space-y-2">
                              {resume.certifications.map((item) => (
                                <p key={item.id} className="text-[11.5px] leading-5 text-slate-600">
                                  {[item.name, item.issuer].filter(Boolean).join(" — ")}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {isSplit && layout !== "sidebar-dark" && (
                    <div className="space-y-8 border-slate-200 md:border-l md:pl-8">
                      {renderSkills()}
                      <div>
                        <PreviewHeading accent={accent}>Education</PreviewHeading>
                        <div className="mt-4 space-y-3">
                          {resume.education.map(item => (
                            <div key={item.id}>
                              <p className="text-[12px] font-black text-slate-900">{item.degree}</p>
                              <p className="mt-1 text-[11px] text-slate-500">{item.school}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {resume.certifications.some((item) => item.name) && (
                        <div>
                          <PreviewHeading accent={accent}>Certifications</PreviewHeading>
                          <div className="mt-4 space-y-2">
                            {resume.certifications.map((item) => (
                              <p key={item.id} className="text-[11.5px] leading-5 text-slate-600">
                                {[item.name, item.issuer].filter(Boolean).join(" — ")}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {resume.more?.filter((item) => item.label && item.value).map((item) => (
                        <div key={item.id}>
                          <PreviewHeading accent={accent}>{item.label}</PreviewHeading>
                          <p className="mt-2 text-[11.5px] leading-5 text-slate-600">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
  );

  if (isPrintMode) {
    return innerContent;
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
        <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="mx-auto aspect-[1/1.414] max-w-[760px] bg-white p-8 md:p-12">
            {innerContent}
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
