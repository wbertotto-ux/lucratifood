import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TrendingUp, DollarSign, AlertCircle, ChefHat, ArrowRight } from "lucide-react";
import { Logo } from "@/components/Logo";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Só redireciona pro dashboard se tiver assinatura ativa — evita loop para usuários sem plano
  if (session) {
    const { data: restaurante } = await supabase.from("restaurantes").select("id").limit(1).maybeSingle();
    if (restaurante) {
      const { data: assinatura } = await supabase
        .from("assinaturas").select("id").eq("restaurante_id", restaurante.id).eq("status", "ativo").maybeSingle();
      if (assinatura) redirect("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Nav — flutuante sobre o hero */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
          <Logo size="sm" href="/" />
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/planos"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Escolha seu plano
            </Link>
          </div>
        </div>
      </header>

      {/* Hero — foto full-viewport, texto no canto inferior esquerdo */}
      <section className="relative h-screen min-h-[600px] overflow-hidden">
        <Image
          src="/images/landing-chef.jpg"
          alt="Chef cozinhando"
          fill
          priority
          className="object-cover object-center scale-x-[-1]"
          sizes="100vw"
        />
        {/* Gradiente sutil na base para legibilidade do texto */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Texto no canto inferior esquerdo — alinhado com o logotipo */}
        <div className="absolute bottom-0 left-0 right-0 pb-16">
          <div className="mx-auto max-w-7xl px-8">
            <div className="max-w-3xl">
              <span className="inline-block text-xs font-semibold uppercase tracking-widest text-white/60 mb-5">
                Precificação para gastronomia
              </span>
              <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight text-white mb-8">
                Você cozinha com paixão e ainda não sabe se está{" "}
                <span className="text-primary">lucrando</span>?
              </h1>
              <div className="flex items-center gap-4">
                <Link
                  href="/planos"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  Escolha seu plano
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="text-sm font-medium text-white/70 hover:text-white transition-colors"
                >
                  Já tenho conta →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção 1 — imagem à direita + texto à esquerda */}
      <section className="grid grid-cols-1 md:grid-cols-2 min-h-[540px]">
        <div className="flex flex-col justify-center px-12 py-20 max-w-xl ml-auto">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">O problema</span>
          <h2 className="text-4xl font-extrabold leading-tight text-foreground mb-6">
            Vende muito, mas o dinheiro some no fim do mês.
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-8">
            Movimento no negócio não garante lucro se o custo por prato está errado. Colocar uma porcentagem por cima é chute. O Lucratifood coloca o custo real de cada ingrediente, com fator de correção e perda de limpeza, e calcula a margem verdadeira por canal de venda.
          </p>
          <ul className="space-y-3 text-sm text-muted-foreground">
            {[
              "Custo por porção calculado em centavos",
              "Margem por canal: Salão, iFood, WhatsApp",
              "Alerta quando o preço não cobre a margem mínima",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative min-h-[400px] md:min-h-full">
          <Image
            src="/images/landing-burger.jpg"
            alt="Hambúrguer artesanal"
            fill
            className="object-cover"
            sizes="50vw"
          />
        </div>
      </section>

      {/* Seção 2 — imagem à esquerda + texto à direita */}
      <section className="grid grid-cols-1 md:grid-cols-2 min-h-[540px]">
        <div className="relative min-h-[400px] md:min-h-full order-2 md:order-1">
          <Image
            src="/images/landing-plating.jpg"
            alt="Chef finalizando prato"
            fill
            className="object-cover"
            sizes="50vw"
          />
        </div>
        <div className="flex flex-col justify-center px-12 py-20 max-w-xl order-1 md:order-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">Como funciona</span>
          <h2 className="text-4xl font-extrabold leading-tight text-foreground mb-6">
            Ficha técnica com o custo real de cada prato.
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-8">
            Cadastre insumos com o preço pago por embalagem e o peso aproveitado. O sistema calcula o custo por grama, aplica o fator de correção e entrega o custo por porção, sem achismo.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { Icon: ChefHat, label: "Fichas técnicas", desc: "Ingredientes e rendimento" },
              { Icon: DollarSign, label: "Preço por canal", desc: "Salão, iFood e outros" },
              { Icon: TrendingUp, label: "Painel de margens", desc: "Ranking em tempo real" },
              { Icon: AlertCircle, label: "Impacto de preço", desc: "Alerta quando sobe" },
            ].map(({ Icon, label, desc }) => (
              <div key={label} className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Seção 3 — imagem full-width com texto sobreposto */}
      <section className="relative min-h-[500px] flex items-end overflow-hidden">
        <Image
          src="/images/landing-kitchen2.jpg"
          alt="Chef cozinhando na cozinha profissional"
          fill
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        <div className="relative z-10 w-full py-16">
          <div className="mx-auto max-w-7xl px-8">
            <div className="max-w-lg">
              <span className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-4 block">Precifique para lucrar</span>
              <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
                Preço certo em cada canal de venda.
              </h2>
              <p className="text-white/70 leading-relaxed mb-5">
                O sistema calcula o preço mínimo considerando impostos, taxa do cartão, comissão do canal e a sua margem desejada. Cada canal tem o seu número.
              </p>
              <p className="text-white/90 leading-relaxed font-medium">
                Precificação correta garantirá previsibilidade de caixa e ajustes assertivos nos valores do cardápio.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pain points */}
      <section className="py-20 px-8 bg-card border-y border-border">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-12">
            Você já passou por isso?
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { emoji: "💸", title: "Vende muito, mas o dinheiro some.", desc: "Vender muito não garante lucro se o custo por prato está errado." },
              { emoji: "📊", title: "O preço é chute.", desc: "Colocar uma porcentagem por cima do custo não garante margem real." },
              { emoji: "📋", title: "Sua planilha quebra na pior hora.", desc: "Fórmula apagada, dado errado. Você perde o controle quando mais precisa." },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-border bg-background p-7">
                <span className="text-3xl mb-4 block">{item.emoji}</span>
                <h3 className="font-bold text-foreground mb-2 leading-snug">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">
              Em menos de uma semana você já enxerga o que nunca enxergou.
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { n: "01", title: "Cadastra insumos", desc: "Nome, preço e quantidade por embalagem." },
              { n: "02", title: "Monta as fichas", desc: "Ingredientes, quantidades, rendimento por porção." },
              { n: "03", title: "Vê o custo real", desc: "Custo por grama, por porção, com perda inclusa." },
              { n: "04", title: "Precifica por canal", desc: "Preço mínimo e sugerido para cada canal." },
            ].map((step) => (
              <div key={step.n}>
                <span className="block text-5xl font-extrabold text-primary/20 mb-3">{step.n}</span>
                <h3 className="font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final — foto de fundo */}
      <section className="relative py-32 px-8 overflow-hidden">
        <Image
          src="/images/landing-pizza.jpg"
          alt=""
          fill
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/65" />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
            Você vai continuar chutando o preço ou quer{" "}
            <span className="text-primary">saber a verdade</span>?
          </h2>
          <p className="text-white/70 mb-10 text-lg">
            Cada dia com preço errado é margem indo embora.
          </p>
          <Link
            href="/planos"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-base font-bold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Escolha seu plano
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-5 text-sm text-white/40">
            Sem planilha · Sem chute · Sem surpresa no fim do mês
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-8">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="md" href="/" />
          <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Lucratifood. Feito para quem trabalha com gastronomia e quer lucrar de verdade.</p>
            <Link href="/privacidade" className="hover:text-foreground transition-colors whitespace-nowrap">
              Política de Privacidade
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
