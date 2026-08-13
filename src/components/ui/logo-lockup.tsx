import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function LogoLockup({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-4", className)}>
      <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-soft-card">
        <Image src="/logo.png" alt="VigilSiddhi Logo" width={68} height={68} priority />
      </span>
      <span className="font-display text-2xl font-extrabold tracking-tight text-slate-900 xl:text-3xl">
        VigilSiddhi<span className="text-primary">AI</span> Resume Builder
      </span>
    </Link>
  );
}
