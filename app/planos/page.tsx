import Link from "next/link";
import { Check, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Planos — Lucratifood",
  description: "Escolha o plano ideal para o seu restaurante e comece a precificar com precisão.",
};

const FEATURES = [
  { label: "Fichas técnicas (pratos)",   essencial: "Até 30",   pro: "Ilimitadas" },
  { label: "Cadastro de insumos",        essencial: "Até 100",  pro: "Ilimitados" },
  { label: "Canais de venda",            essencial: "1 (Salão)", pro: "Ilimitados" },
  { label: "Custo por porção",           essencial: true,       pro: true },
  { label: "Preço sugerido com margem",  essencial: true,       pro: true },
  { label: "Painel de margens",          essencial: "Básico",   pro: "Completo" },
  { label: "Precificação multicanal",    essencial: false,      pro: true },
  { label: "Gráficos de análise",        essencial: false,      pro: true },
  { label: "Alertas de margem",          essencial: false,      pro: true },
  { label: "Histórico de preços",        essencial: false,      pro: true },
  { label: "Importação CSV de insumos",  essencial: false,      pro: true },
  { label: "Exportação de relatórios",   essencial: false,      pro: true },
];

export default async function PlanosPage({ searchParams }: { searchParams: Promise<{ pendente?: string }> }) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const { pendente } = await searchParams;

  // Se já está logado e tem restaurante e assinatura ativa → dashboard
  if (session) {
    const { data: restaurante } = await supabase.from("restaurantes").select("id").limit(1).maybeSingle();
    if (restaurante) {
      const { data: assinatura } = await supabase
        .from("assinaturas")
        .select("status")
        .eq("restaurante_id", restaurante.id)
        .eq("status", "ativo")
        .maybeSingle();
      if (assinatura) redirect("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
          <Logo size="sm" href="/" />
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Entrar
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-8 py-16">
        {pendente && (
          <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            Finalize sua assinatura para acessar o Lucratifood.
          </div>
        )}

        <div className="text-center mb-14">
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4">
            Escolha seu plano
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Precificação correta desde o primeiro prato. Sem trial, sem surpresa.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {/* Essencial */}
          <div className="rounded-2xl border border-border bg-card p-8 flex flex-col">
            <div className="mb-6">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Essencial</span>
              <div className="mt-2 flex items-end gap-1">
                <span className="text-5xl font-extrabold text-foreground">R$ 89</span>
                <span className="text-2xl font-bold text-foreground">,90</span>
                <span className="text-muted-foreground mb-1">/mês</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Ideal para quem quer saber o custo real de cada prato e quanto cobrar.
              </p>
            </div>

            <ul className="space-y-2.5 mb-8 flex-1">
              {[
                "Até 30 fichas técnicas",
                "Até 100 insumos cadastrados",
                "1 canal de venda (Salão)",
                "Custo por porção e CMV",
                "Preço sugerido com margem desejada",
                "Painel de margens básico",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
              {[
                "Precificação multicanal",
                "Gráficos de análise",
                "Alertas automáticos",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground/60">
                  <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href="/cadastro?plano=essencial"
              className="block text-center rounded-xl border border-primary px-6 py-3.5 text-sm font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              Começar com o Essencial
            </Link>
          </div>

          {/* PRO */}
          <div className="rounded-2xl border-2 border-primary bg-card p-8 flex flex-col relative">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground">
              Mais popular
            </span>

            <div className="mb-6">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">PRO</span>
              <div className="mt-2 flex items-end gap-1">
                <span className="text-5xl font-extrabold text-foreground">R$ 179</span>
                <span className="text-2xl font-bold text-foreground">,90</span>
                <span className="text-muted-foreground mb-1">/mês</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Gestão contínua: o sistema avisa, analisa e indica onde agir.
              </p>
            </div>

            <ul className="space-y-2.5 mb-8 flex-1">
              {[
                "Fichas técnicas ilimitadas",
                "Insumos ilimitados",
                "Canais de venda ilimitados",
                "Custo por porção e CMV",
                "Precificação multicanal (iFood, Salão, delivery)",
                "Painel completo com 3 gráficos de análise",
                "Alertas quando a margem cai abaixo do ideal",
                "Histórico de preços dos insumos",
                "Importação CSV de insumos",
                "Exportação de relatórios",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href="/cadastro?plano=pro"
              className="block text-center rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
            >
              Assinar o PRO
            </Link>
          </div>
        </div>

        {/* Tabela comparativa */}
        <div>
          <h2 className="text-2xl font-extrabold text-foreground mb-6 text-center">Comparação completa</h2>
          <div className="rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-6 py-4 font-semibold text-foreground">Recurso</th>
                  <th className="text-center px-6 py-4 font-semibold text-foreground w-32">Essencial</th>
                  <th className="text-center px-6 py-4 font-semibold text-primary w-32">PRO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {FEATURES.map((f) => (
                  <tr key={f.label} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-3.5 text-muted-foreground">{f.label}</td>
                    <td className="px-6 py-3.5 text-center">
                      <FeatureCell value={f.essencial} />
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <FeatureCell value={f.pro} isPro />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA final */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground text-sm mb-4">
            Dúvidas? Fale com a gente pelo WhatsApp antes de assinar.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link
              href="/cadastro?plano=essencial"
              className="rounded-xl border border-primary px-6 py-3 text-sm font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              Começar com o Essencial — R$ 89,90/mês
            </Link>
            <Link
              href="/cadastro?plano=pro"
              className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Assinar o PRO — R$ 179,90/mês
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-8 px-8 mt-16">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" href="/" />
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/privacidade" className="hover:text-foreground transition-colors">Política de Privacidade</Link>
            <span>© {new Date().getFullYear()} Lucratifood</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCell({ value, isPro }: { value: boolean | string; isPro?: boolean }) {
  if (value === true) return <Check className={`w-4 h-4 mx-auto ${isPro ? "text-primary" : "text-foreground"}`} />;
  if (value === false) return <X className="w-4 h-4 mx-auto text-muted-foreground/40" />;
  return <span className={`text-xs font-medium ${isPro ? "text-primary" : "text-muted-foreground"}`}>{value}</span>;
}
