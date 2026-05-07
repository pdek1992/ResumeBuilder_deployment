import type { LabelHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-2 ml-1 block text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400", className)}
      {...props}
    />
  );
}
