import type { ReactNode } from "react";
import { Eye } from "lucide-react";

import type { ResumeData, TemplateRecord } from "@/lib/types";
import { getTemplateRenderConfig, type ExperienceStyle, type SkillStyle } from "@/lib/resume/template-renderer";
import { cn } from "@/lib/utils";

type ResumePreviewProps = {
  resume: ResumeData;
  template: TemplateRecord;
  className?: string;
  isPrintMode?: boolean;
};

function PreviewHeading({
  children,
  accent,
  layout,
  headingStyle,
}: {
  children: ReactNode;
  accent: string;
  layout?: string;
  headingStyle?: string;
}) {
  if (layout === "sleek-dark" || headingStyle === "dark-bg-band") {
    return (
      <div className="mb-4 bg-slate-900 px-4 py-2">
        <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-white">{children}</h3>
      </div>
    );
  }
  if (headingStyle === "serif-underline") {
    return (
      <div className="mb-4 border-b pb-2" style={{ borderColor: accent }}>
        <h3 className="font-serif text-[14px] font-bold uppercase tracking-[0.16em]" style={{ color: accent }}>{children}</h3>
      </div>
    );
  }
  if (headingStyle === "left-border" || headingStyle === "bold-oversized") {
    return (
      <div className="mb-4 flex items-center gap-3">
        <span className="h-6 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
        <h3 className={cn("font-black uppercase", headingStyle === "bold-oversized" ? "text-[15px] tracking-[0.2em]" : "text-[11px] tracking-[0.28em]")} style={{ color: accent }}>{children}</h3>
      </div>
    );
  }
  if (headingStyle === "light-pill") {
    return (
      <span className="inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em]" style={{ backgroundColor: `${accent}12`, color: accent }}>
        {children}
      </span>
    );
  }
  return <h3 className="text-[11px] font-black uppercase tracking-[0.28em]" style={{ color: accent }}>{children}</h3>;
}

function skillPercent(index: number) {
  return Math.max(72, 94 - (index % 5) * 5);
}

export function ResumePreview({ resume, template, className, isPrintMode }: ResumePreviewProps) {
  const fullName = [resume.personal.firstName, resume.personal.lastName].filter(Boolean).join(" ") || "Your Name";
  const accent = template.config_json.accent || resume.style.accent;
  const layout = template.config_json.layout || "standard";
  const renderConfig = getTemplateRenderConfig(layout, template.config_json, accent);
  const isSplit = renderConfig.hasSidebar || template.config_json.columns === "split";
  const headingStyle = renderConfig.sectionHeadingStyle;
  const sectionSpacing = renderConfig.sectionSpacingClass;
  const bodyTextClass = renderConfig.bodyTextClass;
  const isDarkSidebar = layout === "sidebar-dark" || layout === "sidebar-dark-right";
  const isSidebarLayout = renderConfig.hasSidebar && (isDarkSidebar || layout === "sidebar-circles");

  const renderPersonal = () => (
    <div className={cn(
      "px-8 py-10 md:px-12",
      layout === "banner-soft" && "rounded-b-[3rem] shadow-2xl",
      isDarkSidebar && "bg-transparent !px-0 !py-0",
      layout === "modular-card" && "rounded-[2.5rem] border border-slate-100 shadow-sm mb-8",
      !layout.includes("sidebar") && "mb-8"
    )} style={{ 
      backgroundColor: (isDarkSidebar || layout === "modular-card") ? "transparent" : `${accent}15`,
      borderColor: layout === "modular-card" ? accent : undefined,
      color: "inherit"
    }}>
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-6">
            {resume.personal.profilePhotoUrl && ![layout === "sidebar-dark-right" ? "sidebar-dark-right" : "sidebar-dark", "sidebar-circles"].includes(layout) && (
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
        {template.icon && !isDarkSidebar && !resume.personal.profilePhotoUrl && (
          <div className="hidden h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm md:flex">
            <img src={template.icon} alt="" className={cn("h-12 w-12 contrast-125", (layout === "modular-card" ? "opacity-100" : "opacity-40 invert brightness-0"))} />
          </div>
        )}
      </div>
    </div>
  );

  const renderSummary = () => (
    <div className={cn(layout === "modular-card" && "rounded-2xl border p-6")} style={layout === "modular-card" ? { backgroundColor: `${accent}08`, borderColor: `${accent}20` } : {}}>
      <PreviewHeading accent={accent} layout={layout} headingStyle={headingStyle}>Professional Summary</PreviewHeading>
      <p className={cn("mt-3 leading-6 text-slate-600 whitespace-pre-wrap break-words", bodyTextClass)}>
        {resume.summary || "This appears prominently in the preview and final PDF."}
      </p>
    </div>
  );

  const renderExperience = (style: ExperienceStyle = renderConfig.experienceStyle) => (
    <div className={cn(layout === "modular-card" && "rounded-2xl border p-6")} style={layout === "modular-card" ? { backgroundColor: `${accent}08`, borderColor: `${accent}20` } : {}}>
      <PreviewHeading accent={accent} layout={layout} headingStyle={headingStyle}>Experience</PreviewHeading>
      <div className="mt-4 space-y-5">
        {(resume.experience.filter((item) => item.title || item.company).length ? resume.experience : []).map((item) => (
          <div
            key={item.id}
            className={cn(
              "relative break-inside-avoid",
              style === "border-left" && "border-l-2 pl-5",
              style === "timeline-dot" && "pl-6",
              style === "card-block" && "rounded-2xl border border-slate-100 bg-white p-5 shadow-sm",
              style === "bold-row" && "border-b border-slate-100 pb-5"
            )}
            style={style === "border-left" ? { borderColor: accent } : undefined}
          >
            {(layout === "sidebar-circles" || style === "timeline-dot") && (
              <div className="absolute -left-6 top-1 h-3 w-3 rounded-full" style={{ backgroundColor: accent }} />
            )}
            <div className={cn("gap-4", renderConfig.showDateBadge && "flex items-start justify-between")}>
              <div>
                <p className={cn("text-[13px] text-slate-900", style === "bold-row" ? "font-black uppercase tracking-wide" : "font-black")}>{item.title || "Role Title"}</p>
                <p className="mt-1 text-[11px] text-slate-500">{[item.company, item.location].filter(Boolean).join(" | ")}</p>
              </div>
              {renderConfig.showDateBadge && (item.startDate || item.endDate || item.current) && (
                <span className="shrink-0 rounded-full bg-slate-50 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-slate-400">
                  {[item.startDate, item.current ? "Present" : item.endDate].filter(Boolean).join(" - ")}
                </span>
              )}
            </div>
            <ul className={cn("mt-2 ml-4 list-disc space-y-1 leading-5 text-slate-600", bodyTextClass)}>
              {item.highlights.filter(Boolean).map((highlight, index) => (
                <li key={`${item.id}-${index}`} className="break-words whitespace-pre-wrap">{highlight}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSkillItem = (skill: string, index: number, style: SkillStyle) => {
    if (style === "plain-list") {
      return null;
    }
    if (style === "progress-dot") {
      return (
        <div key={skill} className="flex items-center justify-between gap-3 text-[11.5px] text-slate-600">
          <span>{skill}</span>
          <span className="flex gap-1">
            {[0, 1, 2, 3, 4].map((dot) => (
              <span key={dot} className="h-2 w-2 rounded-full" style={{ backgroundColor: dot < 4 - (index % 2) ? accent : `${accent}24` }} />
            ))}
          </span>
        </div>
      );
    }
    if (style === "numbered-bar") {
      const percent = skillPercent(index);
      return (
        <div key={skill} className="space-y-1">
          <div className="flex items-center justify-between gap-3 text-[11px] font-bold text-slate-700">
            <span>{skill}</span>
            <span>{percent}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: accent }} />
          </div>
        </div>
      );
    }
    if (style === "pill-tags" || style === "inline-tags") {
      return (
        <span key={skill} className="rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ borderColor: `${accent}24`, backgroundColor: `${accent}10`, color: accent }}>
          {skill}
        </span>
      );
    }
    if (style === "boxed-grid") {
      return (
        <span key={skill} className="rounded-lg bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white">
          {skill}
        </span>
      );
    }
    return (
      <div key={skill} className="flex items-center gap-2 text-[11.5px] text-slate-600">
        <span className="h-1 w-1 rounded-full" style={{ backgroundColor: accent }} />
        {skill}
      </div>
    );
  };

  const renderSkills = (style: SkillStyle = renderConfig.skillStyle) => (
    <div className={cn(layout === "grid-labels" && "rounded-xl bg-slate-900 p-6 text-white")}>
      <PreviewHeading accent={layout === "grid-labels" ? "#fff" : accent} layout={layout} headingStyle={headingStyle}>Skills</PreviewHeading>
      <div className={cn("mt-4", ["pill-tags", "inline-tags", "boxed-grid"].includes(style) || layout === "grid-labels" ? "flex flex-wrap gap-2" : "space-y-2")}>
        {resume.skills.length > 0 ? (
          style === "plain-list"
            ? <p className="text-[11.5px] leading-6 text-slate-600">{resume.skills.join(" / ")}</p>
            : resume.skills.map((skill, index) => renderSkillItem(skill, index, layout === "grid-labels" ? "boxed-grid" : style))
        ) : (
          <p className="text-[11.5px] text-slate-400">Key skills appear here</p>
        )}
      </div>
    </div>
  );
  
  const renderEducation = () => (
    <div className={cn(
      layout === "modular-card" && "rounded-3xl border p-8",
      isDarkSidebar && "text-white"
    )} style={layout === "modular-card" ? { backgroundColor: `${accent}05`, borderColor: `${accent}15` } : {}}>
      <PreviewHeading accent={isDarkSidebar ? "#fff" : accent} layout={layout} headingStyle={headingStyle}>Education</PreviewHeading>
      <div className="mt-6 space-y-6">
        {resume.education.map(item => (
          <div key={item.id}>
            <div className="flex justify-between items-start gap-4">
               <p className={cn("text-[13.5px] font-black leading-tight", isDarkSidebar ? "text-white" : "text-slate-950")}>{item.degree || "Degree"}</p>
               <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] shrink-0", isDarkSidebar ? "text-white/40" : "text-slate-400")}>{item.endDate}</p>
            </div>
            <p className={cn("mt-1.5 text-[11.5px] font-bold uppercase tracking-wide", isDarkSidebar ? "text-white/60" : "text-slate-500")}>{item.school || "University"}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProjects = () => resume.projects.some((item) => item.name) ? (
    <div className={cn(
      layout === "modular-card" && "rounded-3xl border p-8 shadow-sm",
      layout === "grid-labels" && "md:contents"
    )} style={layout === "modular-card" ? { backgroundColor: `${accent}05`, borderColor: `${accent}15` } : {}}>
      {layout === "grid-labels" && <div className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-300 md:pt-1">Projects</div>}
      <div>
        <PreviewHeading accent={accent} layout={layout} headingStyle={headingStyle}>Projects</PreviewHeading>
        <div className="mt-6 space-y-6">
          {resume.projects.map((item) => (
            <div key={item.id} className="group break-inside-avoid">
              <p className="text-[14px] font-black text-slate-900 group-hover:text-primary transition-colors">{item.name}</p>
              {item.role && <p className="mt-1 text-[10.5px] font-bold uppercase tracking-wide text-slate-400">{item.role}</p>}
              <div className="mt-2 space-y-2">
                {item.highlights.filter(Boolean).map((highlight, index) => (
                  <p key={index} className={cn("leading-relaxed text-slate-600 break-words whitespace-pre-wrap flex gap-3", bodyTextClass)}>
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
  ) : null;

  const renderSectionByKey = (key: string) => {
    switch (key) {
      case "summary":
        return <div key={key}>{layout === "grid-labels" && <div className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-300 md:pt-1">About</div>}{renderSummary()}</div>;
      case "experience":
        return <div key={key}>{layout === "grid-labels" && <div className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-300 md:pt-1">Experience</div>}{renderExperience()}</div>;
      case "projects":
        return <div key={key}>{renderProjects()}</div>;
      case "skills":
        return <div key={key}>{layout === "grid-labels" && <div className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-300 md:pt-1">Skills</div>}{renderSkills()}</div>;
      case "education":
        return <div key={key}>{layout === "grid-labels" && <div className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-300 md:pt-1">Education</div>}{renderEducation()}</div>;
      default:
        return null;
    }
  };

  const innerContent = (
    <div className={cn(
      isPrintMode ? "h-[297mm] w-[210mm] bg-white overflow-hidden print:shadow-none" : "h-full w-full overflow-hidden bg-white shadow-[0_25px_60px_rgba(15,23,42,0.12)]",
      isSidebarLayout && "flex",
      layout === "sleek-dark" && "bg-slate-50"
    )}
    style={{ fontSize: template.config_json.density === "compact" ? "0.95em" : template.config_json.density === "airy" ? "1.02em" : undefined }}
    data-template-id={template.id}
    data-template-layout={layout}
    >
      {/* SIDEBAR COMPONENT */}
      {isSidebarLayout && (
        <div className={cn(
          "shrink-0 p-8 flex flex-col",
          renderConfig.sidebarSide === "right" && "order-2",
          isDarkSidebar ? "bg-slate-900 text-white" : "bg-slate-50 border-r border-slate-100"
        )} style={{ width: renderConfig.sidebarWidthClass.includes("32") ? "32%" : undefined, backgroundColor: isDarkSidebar ? renderConfig.sidebarBg : `${accent}05` }}>
          
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
                <img src={template.icon || "/icons/icon-resume.png"} alt="Icon" className={cn("h-10 w-10", isDarkSidebar ? "opacity-20 brightness-0 invert" : "opacity-10")} />
              </div>
            )}
          </div>

          <div className={cn(sectionSpacing, "flex-1")}>
            {renderSkills()}
            {renderEducation()}
          </div>
          
          {!isPrintMode && <div className="mt-auto pt-8 border-t opacity-20" style={{ borderColor: isDarkSidebar ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}>
             <p className="text-[10px] font-black uppercase tracking-[0.2em]">High Fidelity Resume</p>
          </div>}
        </div>
      )}

      {/* MAIN CONTENT COMPONENT */}
      <div className={cn("flex-1 flex flex-col min-h-full", renderConfig.sidebarSide === "right" && "order-1")}>
        {layout === "sleek-dark" && (
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
        )}

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

        {isDarkSidebar && (
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
          layout === "grid-labels" && "md:grid md:grid-cols-[160px_1fr] md:gap-x-12 md:gap-y-16",
          layout === "modern-columns" && "space-y-12"
        )}>
          {layout === "modern-columns" && (
            <div className="text-center mb-12">
               {resume.personal.profilePhotoUrl && (
                 <div className="mx-auto mb-6 h-32 w-32 overflow-hidden rounded-full border-4 shadow-xl" style={{ borderColor: accent }}>
                   <img src={resume.personal.profilePhotoUrl} alt={fullName} className="h-full w-full object-cover" />
                 </div>
               )}
               <h1 className="text-4xl font-black text-slate-900 tracking-tight">{fullName}</h1>
               <p className="mt-2 text-[14px] font-bold uppercase tracking-widest" style={{ color: accent }}>{resume.personal.headline || resume.ats.targetRole}</p>
            </div>
          )}

          {layout !== "banner-soft" && !isDarkSidebar && layout !== "sidebar-circles" && layout !== "sleek-dark" && layout !== "modern-columns" && renderPersonal()}

          {layout === "modern-columns" ? (
            <div className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-b border-slate-100 pb-12">
                <div className="space-y-8">
                  {renderSkills()}
                  <div>
                    <PreviewHeading accent={accent} layout={layout} headingStyle={headingStyle}>Contact</PreviewHeading>
                    <div className="mt-4 space-y-2 text-[11.5px] text-slate-600">
                       {resume.personal.email && <p>Email: {resume.personal.email}</p>}
                       {resume.personal.phone && <p>Phone: {resume.personal.phone}</p>}
                       {resume.personal.location && <p>Location: {resume.personal.location}</p>}
                    </div>
                  </div>
                </div>
                <div>
                   {resume.projects.some(p => p.name) && (
                     <div className="rounded-2xl border-2 p-6" style={{ borderColor: `${accent}20` }}>
                        <PreviewHeading accent={accent} layout={layout} headingStyle={headingStyle}>Projects</PreviewHeading>
                        <div className="mt-4 space-y-4">
                           {resume.projects.map(p => (
                             <div key={p.id}>
                                <p className="text-[13px] font-bold text-slate-900">{p.name}</p>
                                <p className="text-[11px] text-slate-500 mt-1 italic">{p.role}</p>
                             </div>
                           ))}
                        </div>
                     </div>
                   )}
                </div>
              </div>
              <div className="space-y-12">
                 {renderExperience()}
                 {renderEducation()}
              </div>
            </div>
          ) : (
            <div className={cn(sectionSpacing, layout === "grid-labels" && "md:contents")}>
              {renderConfig.mainSections.map(renderSectionByKey)}

              {isSplit && ![isDarkSidebar ? layout : "sidebar-dark", "sidebar-circles", "banner-soft", "grid-labels", "modern-columns"].includes(layout) && (
                <div className={cn(sectionSpacing, "border-slate-100 md:border-l md:pl-10")}>
                  {renderSkills()}
                  <div>
                    <PreviewHeading accent={accent} layout={layout} headingStyle={headingStyle}>Education</PreviewHeading>
                    <div className="mt-8 space-y-8">
                      {resume.education.map(item => (
                        <div key={item.id} className="text-[11.5px] leading-relaxed text-slate-600">
                          <p className="font-bold text-slate-900">{item.degree}</p>
                          <p className="text-[10.5px] text-slate-500 italic">{item.school}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
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
        <div className="overflow-auto rounded-[2rem] border border-slate-100 bg-slate-100 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="mx-auto aspect-[1/1.414] max-w-[760px] bg-white shadow-2xl">
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
