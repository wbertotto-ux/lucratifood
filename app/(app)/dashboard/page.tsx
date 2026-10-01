import { createClient } from "@/lib/supabase/server";
import { PainelClient } from "./PainelClient";
import { custoPorcao } from "@/lib/calculos";
import type { InsumoCalc, ReceitaCalc, ItemReceitaCalc } from "@/lib/calculos";
import { getAssinaturaAtiva } from "@/lib/assinaturas";

type ReceitaRow = {
  id: string; nome: string; tipo: string; rendimento: number; unidade_rendimento: string;
  itens_receita: ItemReceitaCalc[];
  precos_canal: { canal_id: string; preco_venda: number }[];
};

type SubReceitaRow = {
  id: string; nome: string; rendimento: number; unidade_rendimento: string;
  itens_receita: ItemReceitaCalc[];
};

type CanalRow = { id: string; nome: string; pct_comissao: number };
type RestauranteRow = { id: string; nome: string; pct_impostos: number; pct_taxa_cartao: number; pct_margem_minima: number; porcoes_mes_estimado?: number };
type InsumoRow = InsumoCalc & { nome: string };

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { data: receitasRaw },
    { data: insumosRaw },
    { data: subReceitasRaw },
    { data: canaisRaw },
    { data: restauranteRaw },
    { data: custosOp },
  ] = await Promise.all([
    supabase.from("receitas").select("*, itens_receita!itens_receita_receita_id_fkey(*), precos_canal(*)").eq("arquivado", false).eq("tipo", "prato").order("nome"),
    supabase.from("insumos").select("*").eq("arquivado", false),
    supabase.from("receitas").select("id, nome, rendimento, unidade_rendimento, itens_receita!itens_receita_receita_id_fkey(*)").eq("tipo", "sub_receita").eq("arquivado", false),
    supabase.from("canais_venda").select("*").eq("ativo", true).order("nome"),
    supabase.from("restaurantes").select("*").limit(1).maybeSingle(),
    supabase.from("custos_operacionais").select("valor_mensal, ativo"),
  ]);

  const receitas = (receitasRaw ?? []) as unknown as ReceitaRow[];
  const insumos = (insumosRaw ?? []) as unknown as InsumoRow[];
  const subReceitas = (subReceitasRaw ?? []) as unknown as SubReceitaRow[];
  const canais = (canaisRaw ?? []) as unknown as CanalRow[];
  const restaurante = restauranteRaw as unknown as RestauranteRow | null;

  if (!restaurante) return <div className="p-6">Configure o restaurante primeiro.</div>;

  const assinatura = await getAssinaturaAtiva(restaurante.id);
  const planoId = assinatura?.plano_id ?? "essencial";

  const totalOpMensal = (custosOp ?? []).filter(c => c.ativo).reduce((s, c) => s + Number(c.valor_mensal), 0);
  const porcoesMes = restaurante.porcoes_mes_estimado ?? 300;
  const custoOperacionalPorPorcao = porcoesMes > 0 ? totalOpMensal / porcoesMes : 0;

  const insumoMap = new Map<string, InsumoCalc>(insumos.map((i) => [i.id, i]));
  const srMap = new Map<string, ReceitaCalc>(
    subReceitas.map((sr) => [
      sr.id,
      { id: sr.id, rendimento: sr.rendimento, unidade_rendimento: sr.unidade_rendimento, itens: sr.itens_receita },
    ])
  );

  const pratosComCusto = receitas.map((r) => {
    const rec: ReceitaCalc = { id: r.id, rendimento: r.rendimento, unidade_rendimento: r.unidade_rendimento, itens: r.itens_receita };
    let custoIngredientes = 0;
    try { custoIngredientes = custoPorcao(rec, insumoMap, srMap); } catch { /* ok */ }
    return { ...r, custo: custoIngredientes + custoOperacionalPorPorcao };
  });

  return (
    <PainelClient
      pratos={pratosComCusto}
      canais={canais}
      restaurante={restaurante}
      custoOperacionalPorPorcao={custoOperacionalPorPorcao}
      planoId={planoId}
    />
  );
}
