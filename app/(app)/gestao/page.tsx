import { createClient } from "@/lib/supabase/server";
import { GestaoClient } from "./GestaoClient";
import { custoPorcao } from "@/lib/calculos";
import type { InsumoCalc, ReceitaCalc, ItemReceitaCalc } from "@/lib/calculos";
import { getAssinaturaAtiva } from "@/lib/assinaturas";
import { getVendasMes } from "@/lib/actions/gestao";

type ReceitaRow = {
  id: string; nome: string; rendimento: number; unidade_rendimento: string;
  itens_receita: ItemReceitaCalc[];
  precos_canal: { canal_id: string; preco_venda: number }[];
};
type SubReceitaRow = { id: string; rendimento: number; unidade_rendimento: string; itens_receita: ItemReceitaCalc[] };
type CanalRow = { id: string; nome: string; pct_comissao: number };
type InsumoRow = InsumoCalc & { nome: string };
type RestauranteRow = { id: string; pct_impostos: number; pct_taxa_cartao: number; pct_margem_minima: number };

export default async function GestaoPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes: mesParam } = await searchParams;
  const supabase = await createClient();

  const [
    { data: receitasRaw },
    { data: insumosRaw },
    { data: subReceitasRaw },
    { data: canaisRaw },
    { data: restauranteRaw },
  ] = await Promise.all([
    supabase
      .from("receitas")
      .select("id, nome, rendimento, unidade_rendimento, itens_receita!itens_receita_receita_id_fkey(*), precos_canal(*)")
      .eq("arquivado", false)
      .eq("tipo", "prato")
      .order("nome"),
    supabase.from("insumos").select("*").eq("arquivado", false),
    supabase
      .from("receitas")
      .select("id, rendimento, unidade_rendimento, itens_receita!itens_receita_receita_id_fkey(*)")
      .eq("tipo", "sub_receita")
      .eq("arquivado", false),
    supabase.from("canais_venda").select("id, nome, pct_comissao").eq("ativo", true).order("nome"),
    supabase.from("restaurantes").select("id, pct_impostos, pct_taxa_cartao, pct_margem_minima").limit(1).maybeSingle(),
  ]);

  const restaurante = restauranteRaw as RestauranteRow | null;
  if (!restaurante) return <div className="p-6">Configure o restaurante primeiro.</div>;

  const assinatura = await getAssinaturaAtiva(restaurante.id);
  const planoId = assinatura?.plano_id ?? "essencial";

  const receitas = (receitasRaw ?? []) as unknown as ReceitaRow[];
  const insumos = (insumosRaw ?? []) as unknown as InsumoRow[];
  const subReceitas = (subReceitasRaw ?? []) as unknown as SubReceitaRow[];
  const canais = (canaisRaw ?? []) as unknown as CanalRow[];

  const insumoMap = new Map<string, InsumoCalc>(insumos.map((i) => [i.id, i]));
  const srMap = new Map<string, ReceitaCalc>(
    subReceitas.map((sr) => [
      sr.id,
      { id: sr.id, rendimento: sr.rendimento, unidade_rendimento: sr.unidade_rendimento, itens: sr.itens_receita },
    ])
  );

  const pratos = receitas.map((r) => {
    const rec: ReceitaCalc = { id: r.id, rendimento: r.rendimento, unidade_rendimento: r.unidade_rendimento, itens: r.itens_receita };
    let custo = 0;
    try { custo = custoPorcao(rec, insumoMap, srMap); } catch { /* ok */ }
    return { id: r.id, nome: r.nome, custo, precos_canal: r.precos_canal };
  });

  // Mês padrão: mês corrente no formato YYYY-MM
  const mesAtual = new Date().toISOString().slice(0, 7);
  const mes = mesParam ?? mesAtual;
  const vendasExistentes = await getVendasMes(mes);

  return (
    <GestaoClient
      pratos={pratos}
      canais={canais}
      restaurante={restaurante}
      restauranteId={restaurante.id}
      planoId={planoId}
      mes={mes}
      vendasExistentes={vendasExistentes}
    />
  );
}
