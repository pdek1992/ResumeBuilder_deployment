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
      "px-8 py-10 md:px-12",
      layout === "banner-soft" && "rounded-b-[3rem] shadow-2xl",
      layout === "sidebar-dark" && "bg-transparent !px-0 !py-0",
      layout === "modular-card" && "rounded-[2.5rem] border border-slate-100 shadow-sm mb-8",
      !layout.includes("sidebar") && "mb-8"
    )} style={{ 
      backgroundColor: (layout === "sidebar-dark" || layout === "modular-card") ? "transparent" : `${accent}15`,
      borderColor: layout === "modular-card" ? accent : undefined,
      color: "inherit"
    }}>
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-6">
            {resume.personal.profilePhotoUrl && !["sidebar-dark", "sidebar-circles"].includes(layout) && (
              <div className={cn(
                "h-24 w-24 shrink-0 overflow-hidden shadow-2xl border-4 border-white",
                layout === "banner-soft" ? "rounded-[2rem]" : "rounded-3xl"
              )}>
                <img src={resume.personal.profilePhotoUrl} alt={fullName} className="h-full w-full object-cover" />
              </div>
            )}
            <div>
              <h1 className="font-display text-[28px] font-black leading-tight tracking-tight break-words text-slate-950 md:text-[36px]">{fullName}</h1>
              <p className="mt-2 text-[13px] font-bold uppercase tracking-widest break-words" style={{ color: accent }}>
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
        {template.icon && layout !== "sidebar-dark" && !resume.personal.profilePhotoUrl && (
          <div className="hidden h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm md:flex">
            <img src={template.icon} alt="" className={cn("h-12 w-12 contrast-125", (layout === "modular-card" ? "opacity-100" : "opacity-40 invert brightness-0"))} />
          </div>
        )}
      </div>
    </div>
  );

  const renderSummary = () => (
    <div className={cn(layout === "modular-card" && "rounded-2xl border p-6")} style={layout === "modular-card" ? { backgroundColor: `${accent}08`, borderColor: `${accent}20` } : {}}>
      <PreviewHeading accent={accent}>Professional Summary</PreviewHeading>
      <p className="mt-3 text-[12.5px] leading-6 text-slate-600 whitespace-pre-wrap break-words">
        {resume.summary || "This appears prominently in the preview and final PDF."}
      </p>
    </div>
  );

  const renderExperience = () => (
    <div className={cn(layout === "modular-card" && "rounded-2xl border p-6")} style={layout === "modular-card" ? { backgroundColor: `${accent}08`, borderColor: `${accent}20` } : {}}>
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
      (layout === "sidebar-dark" || layout === "sidebar-circles") && "flex"
    )}>
      {/* SIDEBAR COMPONENT */}
      {(layout === "sidebar-dark" || layout === "sidebar-circles") && (
        <div className={cn(
          "w-[32%] shrink-0 p-8 flex flex-col",
          layout === "sidebar-dark" ? "bg-slate-900 text-white" : "bg-slate-50 border-r border-slate-100"
        )} style={layout === "sidebar-circles" ? { backgroundColor: `${accent}05` } : {}}>
          
          <div className="mb-10">
            {resume.personal.profilePhotoUrl ? (
              <div className={cn(
                "mx-auto overflow-hidden shadow-xl border-4",
                layout === "sidebar-circles" ? "h-32 w-32 rounded-full border-white" : "h-36 w-36 rounded-3xl border-white/20"
              )}>
                <img src={resume.personal.profilePhotoUrl} alt={fullName} className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className={cn(
                "mx-auto flex items-center justify-center bg-white shadow-sm",
                layout === "sidebar-circles" ? "h-20 w-20 rounded-full" : "h-24 w-24 rounded-2xl bg-white/10"
              )}>
                <img src={template.icon || "/icons/icon-resume.png"} alt="Icon" className={cn("h-10 w-10", layout === "sidebar-dark" ? "opacity-20 brightness-0 invert" : "opacity-10")} />
              </div>
            )}
          </div>

          <div className="space-y-12 flex-1">
            {renderSkills()}
            <div>
              <PreviewHeading accent={layout === "sidebar-dark" ? "#fff" : accent}>Education</PreviewHeading>
              <div className="mt-6 space-y-6">
                {resume.education.map(item => (
                  <div key={item.id}>
                    <p className={cn("text-[13px] font-bold", layout === "sidebar-dark" ? "text-white" : "text-slate-900")}>{item.degree}</p>
                    <p className={cn("mt-1 text-[11px]", layout === "sidebar-dark" ? "text-white/70" : "text-slate-500")}>{item.school}</p>
                    <p className={cn("mt-1 text-[10px] font-medium tracking-wider uppercase", layout === "sidebar-dark" ? "text-white/40" : "text-slate-400")}>{item.endDate}</p>
                  </div>
                ))}
              </div>
            </div>
            {resume.certifications.length > 0 && (
              <div>
                <PreviewHeading accent={layout === "sidebar-dark" ? "#fff" : accent}>Certifications</PreviewHeading>
                <div className="mt-6 space-y-4">
                  {resume.certifications.map(item => (
                    <div key={item.id} className={cn("text-[11px]", layout === "sidebar-dark" ? "text-white/70" : "text-slate-500")}>
                      <span className={cn("font-bold", layout === "sidebar-dark" ? "text-white" : "text-slate-900")}>{item.name}</span>
                      {item.issuer && <span className="block opacity-60 italic">{item.issuer}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-auto pt-8 border-t opacity-20" style={{ borderColor: layout === "sidebar-dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}>
             <p className="text-[10px] font-black uppercase tracking-[0.2em]">High Fidelity Resume</p>
          </div>
        </div>
      )}

      {/* MAIN CONTENT COMPONENT */}
      <div className="flex-1 flex flex-col min-h-full">
        {layout === "banner-soft" && (
          <div className="p-10 text-center" style={{ backgroundColor: `${accent}15` }}>
             {resume.personal.profilePhotoUrl && (
               <div className="mx-auto mb-6 h-28 w-28 overflow-hidden rounded-[2rem] border-4 border-white shadow-2xl">
                 <img src={resume.personal.profilePhotoUrl} alt={fullName} className="h-full w-full object-cover" />
               </div>
             )}
             <h1 className="text-4xl font-black tracking-tight text-slate-950">{fullName}</h1>
             <p className="mt-3 text-[14px] font-bold uppercase tracking-[0.35em]" style={{ color: accent }}>{resume.personal.headline || resume.ats.targetRole}</p>
             <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
               {resume.personal.location && <span>{resume.personal.location}</span>}
               {resume.personal.email && <span>{resume.personal.email}</span>}
               {resume.personal.phone && <span>{resume.personal.phone}</span>}
               {resume.personal.linkedIn && <span>LinkedIn</span>}
             </div>
          </div>
        )}

        {layout === "sidebar-dark" && (
          <div className="px-10 py-12">
             <h1 className="text-[42px] font-black tracking-tighter text-slate-950 leading-none">{fullName}</h1>
             <p className="mt-4 text-[16px] font-bold uppercase tracking-[0.4em] text-slate-400">{resume.personal.headline || resume.ats.targetRole}</p>
             <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4 text-[11px] font-bold text-slate-500 border-b border-slate-100 pb-10 uppercase tracking-widest">
               {resume.personal.location && <span>{resume.personal.location}</span>}
               {resume.personal.email && <span>{resume.personal.email}</span>}
               {resume.personal.phone && <span>{resume.personal.phone}</span>}
               {resume.personal.linkedIn && <span>LinkedIn</span>}
             </div>
          </div>
        )}

        <div className={cn(
          "flex-1 px-8 py-10 md:px-12",
          layout === "grid-labels" && "md:grid md:grid-cols-[160px_1fr] md:gap-x-12 md:gap-y-16"
        )}>
          {layout !== "banner-soft" && layout !== "sidebar-dark" && layout !== "sidebar-circles" && renderPersonal()}

          <div className={cn("space-y-12", layout === "grid-labels" && "md:contents")}>
            {layout === "grid-labels" && <div className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-300 md:pt-1">About</div>}
            {renderSummary()}
            
            {layout === "grid-labels" && <div className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-300 md:pt-1">Experience</div>}
            {renderExperience()}

            {resume.projects.some((item) => item.name) && (
              <div className={cn(
                layout === "modular-card" && "rounded-3xl border p-8 shadow-sm",
                layout === "grid-labels" && "md:contents"
              )} style={layout === "modular-card" ? { backgroundColor: `${accent}05`, borderColor: `${accent}15` } : {}}>
                {layout === "grid-labels" && <div className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-300 md:pt-1">Projects</div>}
                <div>
                  <PreviewHeading accent={accent}>Projects</PreviewHeading>
                  <div className="mt-6 space-y-6">
                    {resume.projects.map((item) => (
                      <div key={item.id} className="group">
                        <p className="text-[14px] font-black text-slate-900 group-hover:text-primary transition-colors">{item.name}</p>
                        <div className="mt-2 space-y-2">
                          {item.highlights.filter(Boolean).map((highlight, index) => (
                            <p key={index} className="text-[11.5px] leading-relaxed text-slate-600 break-words whitespace-pre-wrap flex gap-3">
                              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-300" />
                              {highlight}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {(resume.ats.targetCompany || resume.ats.targetRole) && (
              <div className={cn(
                layout === "modular-card" && "rounded-3xl border p-8 shadow-sm",
                layout === "grid-labels" && "md:contents"
              )} style={layout === "modular-card" ? { backgroundColor: `${accent}05`, borderColor: `${accent}15` } : {}}>
                {layout === "grid-labels" && <div className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-300 md:pt-1">Inspired by</div>}
                <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100" style={{ borderLeft: `4px solid ${accent}` }}>
                  <PreviewHeading accent={accent}>Inspired by this</PreviewHeading>
                  <div className="mt-4">
                    <p className="text-[14px] font-black text-slate-900">{resume.ats.targetRole || "Target Designation"}</p>
                    <p className="mt-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">{resume.ats.targetCompany || "Target Company"}</p>
                    {resume.ats.targetJobDescription && (
                      <div className="mt-4 rounded-xl bg-white/50 p-4 text-[11.5px] leading-relaxed text-slate-600 italic">
                        "{resume.ats.targetJobDescription.substring(0, 200)}..."
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {(!isSplit || ["sidebar-dark", "sidebar-circles", "banner-soft"].includes(layout)) && (
              <div className={cn(layout === "grid-labels" && "md:contents")}>
                {layout === "grid-labels" && <div className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-300 md:pt-1">Extras</div>}
                <div className="space-y-12">
                  {renderSkills()}
                  <div className={cn(layout === "modular-card" && "rounded-3xl border p-8")} style={layout === "modular-card" ? { backgroundColor: `${accent}05`, borderColor: `${accent}15` } : {}}>
                    <PreviewHeading accent={accent}>Education</PreviewHeading>
                    <div className="mt-6 space-y-8">
                      {resume.education.map(item => (
                        <div key={item.id}>
                          <div className="flex justify-between items-start">
                             <p className="text-[14px] font-black text-slate-950 leading-tight">{item.degree}</p>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{item.endDate}</p>
                          </div>
                          <p className="mt-2 text-[12px] font-bold text-slate-500 uppercase tracking-wide">{item.school}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fallback column for other split layouts */}
          {isSplit && !["sidebar-dark", "sidebar-circles", "banner-soft", "grid-labels"].includes(layout) && (
            <div className="space-y-12 border-slate-100 md:border-l md:pl-10">
              {renderSkills()}
              <div>
                <PreviewHeading accent={accent}>Education</PreviewHeading>
                <div className="mt-8 space-y-8">
                  {resume.education.map(item => (
                    <div key={item.id} className="text-[11.5px] leading-relaxed text-slate-600">
                      <p className="font-bold text-slate-900">{item.degree}</p>
                      <p className="text-[10.5px] text-slate-500 italic">{item.school}</p>
                    </div>
                  ))}
                </div>
              </div>

              {resume.more?.filter((item) => item.label && item.value).map((item) => (
                <div key={item.id}>
                  <PreviewHeading accent={accent}>{item.label}</PreviewHeading>
                  <p className="mt-4 text-[11.5px] leading-relaxed text-slate-600 bg-slate-50 rounded-2xl p-4 border border-slate-100">{item.value}</p>
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
        <div className="mx-auto aspect-[1/1.414] max-w-[640px] bg-white p-6 md:p-10 shadow-2xl">
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
