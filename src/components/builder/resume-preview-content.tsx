import type { ResumeData, TemplateRecord } from "@/lib/types";
import { TemplateRegistry } from "./templates";
export type ResumePreviewProps = {
  resume: ResumeData;
  template: TemplateRecord;
  className?: string;
  isPrintMode?: boolean;
};


export function ResumePreviewContent(props: ResumePreviewProps) {
  const { template } = props;
  const layout = template.config_json.layout || "standard";
  
  const DedicatedComponent = TemplateRegistry[template.id] || TemplateRegistry[layout] || TemplateRegistry["standard"];
  
  if (!DedicatedComponent) {
    return (
      <div className="flex h-full min-h-[297mm] w-[210mm] items-center justify-center bg-white p-12 text-center text-slate-500 shadow-xl">
        <p>Template layout "{layout}" not found.</p>
      </div>
    );
  }

  return <DedicatedComponent {...props} />;
}

