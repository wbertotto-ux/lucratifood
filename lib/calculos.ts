// Engine de cálculo — funções puras sem efeitos colaterais

export type UnidadeBase = "g" | "kg" | "ml" | "l" | "un";

export interface InsumoCalc {
  id: string;
  preco_pago: number;
  qtd_por_embalagem: number;
  unidade_base: UnidadeBase;
  fator_correcao: number;
}

export interface ItemReceitaCalc {
  insumo_id: string | null;
  sub_receita_id: string | null;
  qtd_liquida: number;
  unidade: string;
}

export interface ReceitaCalc {
  id: string;
  rendimento: number;
  unidade_rendimento: string;
  itens: ItemReceitaCalc[];
}

export interface PctCanal {
  pct_impostos: number;
  pct_taxa_cartao: number;
  pct_comissao: number;
  pct_margem_desejada: number;
}

// ----------------------------------------------------------------
// Conversão de unidades
// ----------------------------------------------------------------

const CONVERSOES: Record<string, Record<string, number>> = {
  kg: { g: 1000, kg: 1 },
  g: { g: 1, kg: 0.001 },
  l: { ml: 1000, l: 1 },
  ml: { ml: 1, l: 0.001 },
  un: { un: 1 },
};

export function converterUnidade(
  valor: number,
  de: string,
  para: string
): number {
  const deNorm = de.toLowerCase().trim();
  const paraNorm = para.toLowerCase().trim();
  if (deNorm === paraNorm) return valor;
  const fator = CONVERSOES[deNorm]?.[paraNorm];
  if (fator === undefined) {
    throw new Error(`Conversão de "${de}" para "${para}" não suportada`);
  }
  return valor * fator;
}

// ----------------------------------------------------------------
// Custo unitário do insumo (por unidade base)
// ----------------------------------------------------------------

export function custoUnitario(insumo: InsumoCalc): number {
  return insumo.preco_pago / insumo.qtd_por_embalagem;
}

// ----------------------------------------------------------------
// Custo de um item da receita
// ----------------------------------------------------------------

export function custoItem(
  item: ItemReceitaCalc,
  insumos: Map<string, InsumoCalc>,
  subReceitas: Map<string, ReceitaCalc>,
  visitados: Set<string> = new Set()
): number {
  if (item.insumo_id) {
    const insumo = insumos.get(item.insumo_id);
    if (!insumo) throw new Error(`Insumo ${item.insumo_id} não encontrado`);

    const qtdNaUnidadeBase = converterUnidade(
      item.qtd_liquida,
      item.unidade,
      insumo.unidade_base
    );
    const qtdBruta = qtdNaUnidadeBase * insumo.fator_correcao;
    return qtdBruta * custoUnitario(insumo);
  }

  if (item.sub_receita_id) {
    const sr = subReceitas.get(item.sub_receita_id);
    if (!sr) throw new Error(`Sub-receita ${item.sub_receita_id} não encontrada`);
    const custoTotal = custoSubReceita(sr, insumos, subReceitas, visitados);
    const qtdNaUnidadeSr = converterUnidade(
      item.qtd_liquida,
      item.unidade,
      sr.unidade_rendimento
    );
    return (custoTotal / sr.rendimento) * qtdNaUnidadeSr;
  }

  throw new Error("Item sem insumo_id nem sub_receita_id");
}

// ----------------------------------------------------------------
// Custo total de uma sub-receita (detecta referência circular)
// ----------------------------------------------------------------

export function custoSubReceita(
  receita: ReceitaCalc,
  insumos: Map<string, InsumoCalc>,
  subReceitas: Map<string, ReceitaCalc>,
  visitados: Set<string> = new Set()
): number {
  if (visitados.has(receita.id)) {
    throw new Error(`Referência circular detectada na sub-receita ${receita.id}`);
  }
  const novaVisita = new Set(visitados).add(receita.id);
  return receita.itens.reduce(
    (soma, item) => soma + custoItem(item, insumos, subReceitas, novaVisita),
    0
  );
}

// ----------------------------------------------------------------
// Custo por porção de um prato
// ----------------------------------------------------------------

export function custoPorcao(
  receita: ReceitaCalc,
  insumos: Map<string, InsumoCalc>,
  subReceitas: Map<string, ReceitaCalc>
): number {
  const custoTotal = receita.itens.reduce(
    (soma, item) => soma + custoItem(item, insumos, subReceitas),
    0
  );
  return custoTotal / receita.rendimento;
}

// ----------------------------------------------------------------
// Precificação
// ----------------------------------------------------------------

export function precoSugerido(custo: number, pcts: PctCanal): number {
  const denominador =
    1 - pcts.pct_impostos - pcts.pct_taxa_cartao - pcts.pct_comissao - pcts.pct_margem_desejada;
  if (denominador <= 0) {
    throw new Error("Percentuais somam 100% ou mais — preço sugerido impossível");
  }
  return custo / denominador;
}

export function margemContribuicao(
  preco: number,
  custo: number,
  pcts: Omit<PctCanal, "pct_margem_desejada">
): number {
  const pctVariaveis = pcts.pct_impostos + pcts.pct_taxa_cartao + pcts.pct_comissao;
  return preco - custo - preco * pctVariaveis;
}

export function cmvPct(custo: number, preco: number): number {
  if (preco === 0) return 0;
  return custo / preco;
}

// ----------------------------------------------------------------
// Impacto em cascata de uma alteração de preço
// ----------------------------------------------------------------

export interface ResultadoImpacto {
  receita_id: string;
  canal_id: string;
  custo_anterior: number;
  custo_novo: number;
  margem_anterior: number;
  margem_nova: number;
  preco_sugerido_novo: number;
}

export interface PrecoCanalImpacto {
  canal_id: string;
  preco_venda: number;
  pcts: PctCanal;
}

export function impactoAlteracao(
  insumoId: string,
  novoPreco: number,
  receitas: ReceitaCalc[],
  insumos: Map<string, InsumoCalc>,
  subReceitas: Map<string, ReceitaCalc>,
  precosPorReceita: Map<string, PrecoCanalImpacto[]>,
  overheadPorPorcao = 0
): ResultadoImpacto[] {
  const insumoOriginal = insumos.get(insumoId);
  if (!insumoOriginal) return [];

  const insumosNovos = new Map(insumos);
  insumosNovos.set(insumoId, { ...insumoOriginal, preco_pago: novoPreco });

  const resultados: ResultadoImpacto[] = [];

  for (const receita of receitas) {
    const afeta = receitaUsaInsumo(receita, insumoId, subReceitas);
    if (!afeta) continue;

    const custoAnt = custoPorcao(receita, insumos, subReceitas) + overheadPorPorcao;
    const custoNovo = custoPorcao(receita, insumosNovos, subReceitas) + overheadPorPorcao;
    const canais = precosPorReceita.get(receita.id) ?? [];

    for (const canal of canais) {
      const margAnt = margemContribuicao(canal.preco_venda, custoAnt, canal.pcts);
      const margNova = margemContribuicao(canal.preco_venda, custoNovo, canal.pcts);
      const sugerido = precoSugerido(custoNovo, canal.pcts);

      resultados.push({
        receita_id: receita.id,
        canal_id: canal.canal_id,
        custo_anterior: custoAnt,
        custo_novo: custoNovo,
        margem_anterior: margAnt,
        margem_nova: margNova,
        preco_sugerido_novo: sugerido,
      });
    }
  }

  return resultados;
}

function receitaUsaInsumo(
  receita: ReceitaCalc,
  insumoId: string,
  subReceitas: Map<string, ReceitaCalc>,
  visitados: Set<string> = new Set()
): boolean {
  if (visitados.has(receita.id)) return false;
  const novaVisita = new Set(visitados).add(receita.id);

  for (const item of receita.itens) {
    if (item.insumo_id === insumoId) return true;
    if (item.sub_receita_id) {
      const sr = subReceitas.get(item.sub_receita_id);
      if (sr && receitaUsaInsumo(sr, insumoId, subReceitas, novaVisita)) return true;
    }
  }
  return false;
}
