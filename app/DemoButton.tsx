"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { DemoModal } from "./DemoModal";

interface Props {
  variant?: "primary" | "hero";
}

export function DemoButton({ variant = "primary" }: Props) {
  const [open, setOpen] = useState(false);

  const className =
    variant === "hero"
      ? "inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity"
      : "rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity";

  const ctaLarge =
    variant === "hero"
      ? "inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-5 text-lg font-bold text-primary-foreground hover:opacity-90 transition-opacity shadow-xl shadow-primary/30"
      : className;

  return (
    <>
      <button onClick={() => setOpen(true)} className={className}>
        {variant === "hero" ? (
          <>
            Solicitar demonstração
            <ArrowRight className="w-4 h-4" />
          </>
        ) : (
          "Solicitar demonstração"
        )}
      </button>
      <DemoModal open={open} onOpenChange={setOpen} />
    </>
  );
}

export function DemoButtonLarge() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-5 text-lg font-bold text-primary-foreground hover:opacity-90 transition-opacity shadow-xl shadow-primary/30"
      >
        Solicitar demonstração
        <ArrowRight className="w-5 h-5" />
      </button>
      <DemoModal open={open} onOpenChange={setOpen} />
    </>
  );
}
