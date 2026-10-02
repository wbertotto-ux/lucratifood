import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { iniciarCheckout } from "@/lib/actions/checkout";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lock, AlertTriangle } from "lucide-react";

const NOMES: Record<string, string> = {
  essencial: "Essencial",
  pro: "PRO",
};

const PRECOS: Record<string, string> = {
  essencial: "R$ 89,90/mês",
  pro: "R$ 179,90/mês",
};

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ plano?: string; erro?: string }> }) {
  const { plano, erro } = await searchParams;
  if (!plano || !NOMES[plano]) redirect("/planos");

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect(`/login?redirect=/checkout?plano=${plano}`);

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
          <Logo size="sm" href="/" />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                Resumo da assinatura
              </p>
              <h1 className="text-2xl font-extrabold text-foreground">
                Lucratifood {NOMES[plano]}
              </h1>
              <p className="text-3xl font-bold text-primary mt-2">{PRECOS[plano]}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Cobrado mensalmente · Cancele quando quiser
              </p>
            </div>

            <div className="border-t border-border pt-5 mb-6">
              <p className="text-sm text-muted-foreground mb-3">
                Você será redirecionado para a página de pagamento segura do Asaas, onde poderá pagar com:
              </p>
              <ul className="space-y-1.5 text-sm font-medium text-foreground">
                {["Pix (aprovação instantânea)", "Cartão de crédito", "Boleto bancário"].map((m) => (
                  <li key={m} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    {m}
                  </li>
                ))}
              </ul>
            </div>

            {erro === "pagamento" && (
              <div className="mb-4 flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Não foi possível conectar ao sistema de pagamento. Tente novamente em instantes.
              </div>
            )}

            <form action={iniciarCheckout}>
              <input type="hidden" name="plano" value={plano} />
              <Button type="submit" className="w-full gap-2 text-base py-6" size="lg">
                Ir para o pagamento
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="w-3 h-3" />
              Pagamento seguro via Asaas
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Escolheu errado?{" "}
            <Link href="/planos" className="text-primary hover:underline font-medium">
              Ver planos
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
