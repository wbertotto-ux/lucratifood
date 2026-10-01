"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PlanoGateProps {
  planoId: string;
  feature: string;
  teaser?: string;
  children: React.ReactNode;
}

export function PlanoGate({ planoId, feature, teaser, children }: PlanoGateProps) {
  if (planoId === "pro") return <>{children}</>;

  return (
    <div className="relative rounded-xl overflow-hidden">
      <div className="pointer-events-none select-none blur-[3px] opacity-50">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-[1px] rounded-xl p-6 text-center">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <Lock className="w-5 h-5 text-primary" />
        </div>
        <p className="font-semibold text-foreground mb-1">{feature}</p>
        {teaser && <p className="text-sm text-muted-foreground mb-4 max-w-xs">{teaser}</p>}
        <Link href="/planos" className={cn(buttonVariants({ size: "sm" }))}>Fazer upgrade para o PRO</Link>
      </div>
    </div>
  );
}
