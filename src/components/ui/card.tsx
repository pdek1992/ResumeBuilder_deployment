import * as React from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-5xl border border-white/70 bg-white/85 shadow-soft-card backdrop-blur",
        className,
      )}
      {...props}
    />
  );
}
