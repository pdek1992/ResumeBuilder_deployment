import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function LogoLockup({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-3", className)}>
      <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-soft-card">
        <Image src="/logo.png" alt="VigilSiddhi Logo" width={48} height={48} priority />
      </span>
      <span className="font-display text-3xl font-extrabold tracking-tight text-slate-900">
        VigilSiddhi<span className="text-primary">AI</span>
      </span>
    </Link>
  );
}
