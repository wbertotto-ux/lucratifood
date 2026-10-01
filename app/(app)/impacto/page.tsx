import { createClient } from "@/lib/supabase/server";
import { ImpactoClient } from "./ImpactoClient";
import { impactoAlteracao } from "@/lib/calculos";
import type { InsumoCalc, ReceitaCalc, ItemReceitaCalc, PrecoCanalImpacto } from "@/lib/calculos";

type ReceitaRow = {
  id: string; nome: string; rendimento: number; unidade_rendimento: string;
  itens_receita: ItemReceitaCalc[];
  precos_canal: { canal_id: string; preco_venda: number }[];
};
type SubReceitaRow = {
  id: string; rendimento: number; unidade_rendimento: string; itens_receita: ItemReceitaCalc[];
};
type CanalRow = { id: string; nome: string; pct_comissao: number };
type RestauranteRow = {
  pct_impostos: number; pct_taxa_cartao: number; pct_margem_minima: number; porcoes_mes_estimado?: number;
};
type InsumoRow = InsumoCalc & { nome: string; preco_pago: number };

interface SearchParams {
  insumo_id?: string;
  novo_preco?: string;
  preco_anterior?: string;
}

export default async function ImpactoPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const { insumo_id, novo_preco, preco_anterior } = params;

  if (!insumo_id || !novo_preco) {
    return (
      <div className="p-6 text-muted-foreground">
        Parâmetros ausentes. Atualize o preco de um insumo para ver o impacto.
      </div>
    );
  }

  const supabase = await createClient();

  const r0 = supabase.from("insumos").select("*").eq("arquivado", false);
  const r1 = supabase.from("receitas").select("*, itens_receita!itens_receita_receita_id_fkey(*), precos_canal(*)").eq("arquivado", false).eq("tipo", "prato");
  const r2 = supabase.from("receitas").select("id, rendimento, unidade_rendimento, itens_receita!itens_receita_receita_id_fkey(*)").eq("arquivado", false).eq("tipo", "sub_receita");
  const r3 = supabase.from("canais_venda").select("*").eq("ativo", true);
  const r4 = supabase.from("insumos").select("nome, preco_pago").eq("id", insumo_id).single();
  const r5 = supabase.from("restaurantes").select("*").limit(1).maybeSingle();
  const r6 = supabase.from("custos_operacionais").select("valor_mensal, ativo");

  const [res0, res1, res2, res3, res4, res5, res6] = await Promise.all([r0, r1, r2, r3, r4, r5, r6]);

  const insumos = ((res0.data ?? []) as unknown) as InsumoRow[];
  const receitas = ((res1.data ?? []) as unknown) as ReceitaRow[];
  const subReceitas = ((res2.data ?? []) as unknown) as SubReceitaRow[];
  const canais = ((res3.data ?? []) as unknown) as CanalRow[];
  const insumo = (res4.data as unknown) as { nome: string; preco_pago: number } | null;
  const restaurante = (res5.data as unknown) as RestauranteRow | null;
  const custosOp = res6.data ?? [];

  if (!restaurante) return null;

  const totalOpMensal = custosOp
    .filter((c: { ativo: boolean }) => c.ativo)
    .reduce((s: number, c: { valor_mensal: number }) => s + Number(c.valor_mensal), 0);
  const porcoesMes = restaurante.porcoes_mes_estimado ?? 300;
  const custoOperacionalPorPorcao = porcoesMes > 0 ? totalOpMensal / porcoesMes : 0;

  const insumoMap = new Map<string, InsumoCalc>(insumos.map((i) => [i.id, i]));
  const srMap = new Map<string, ReceitaCalc>(
    subReceitas.map((sr) => [
      sr.id,
      { id: sr.id, rendimento: sr.rendimento, unidade_rendimento: sr.unidade_rendimento, itens: sr.itens_receita },
    ])
  );

  const receitasCalc: ReceitaCalc[] = receitas.map((r) => ({
    id: r.id, rendimento: r.rendimento, unidade_rendimento: r.unidade_rendimento, itens: r.itens_receita,
  }));

  const precosPorReceita = new Map<string, PrecoCanalImpacto[]>(
    receitas.map((r) => [
      r.id,
      r.precos_canal.map((pc) => {
        const canal = canais.find((c) => c.id === pc.canal_id);
        return {
          canal_id: pc.canal_id,
          preco_venda: pc.preco_venda,
          pcts: {
            pct_impostos: restaurante.pct_impostos,
            pct_taxa_cartao: restaurante.pct_taxa_cartao,
            pct_comissao: canal?.pct_comissao ?? 0,
            pct_margem_desejada: restaurante.pct_margem_minima,
          },
        };
      }),
    ])
  );

  const resultados = impactoAlteracao(
    insumo_id,
    parseFloat(novo_preco),
    receitasCalc,
    insumoMap,
    srMap,
    precosPorReceita,
    custoOperacionalPorPorcao
  );

  return (
    <ImpactoClient
      resultados={resultados}
      canais={canais}
      receitas={receitas.map((r) => ({ id: r.id, nome: r.nome }))}
      insumoNome={insumo?.nome ?? ""}
      novoPreco={parseFloat(novo_preco)}
      precoAnterior={parseFloat(preco_anterior ?? String(insumo?.preco_pago ?? "0"))}
    />
  );
}
