import type { ResumeData, TemplateRecord } from "@/lib/types";
import { TemplateRegistry } from "./templates";
export type ResumePreviewProps = {
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

export function ResumePreviewContent(props: ResumePreviewProps) {
  const { template } = props;
  const layout = template.config_json.layout || "standard";
  
  const DedicatedComponent = TemplateRegistry[layout] || TemplateRegistry["standard"];
  
  if (!DedicatedComponent) {
    return (
      <div className="flex h-full min-h-[297mm] w-[210mm] items-center justify-center bg-white p-12 text-center text-slate-500 shadow-xl">
        <p>Template layout "{layout}" not found.</p>
      </div>
    );
  }

  return <DedicatedComponent {...props} />;
}

