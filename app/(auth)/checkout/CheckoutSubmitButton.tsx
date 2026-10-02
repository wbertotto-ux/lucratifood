"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";

export function CheckoutSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full gap-2 text-base py-6" size="lg" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Processando…
        </>
      ) : (
        <>
          Ir para o pagamento
          <ArrowRight className="w-4 h-4" />
        </>
      )}
    </Button>
  );
}
