import { describe, it, expect } from "vitest";
import {
  converterUnidade,
  custoUnitario,
  custoItem,
  custoSubReceita,
  custoPorcao,
  precoSugerido,
  margemContribuicao,
  cmvPct,
  impactoAlteracao,
  type InsumoCalc,
  type ReceitaCalc,
  type ItemReceitaCalc,
  type PctCanal,
} from "@/lib/calculos";

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

function insumoMap(insumos: InsumoCalc[]): Map<string, InsumoCalc> {
  return new Map(insumos.map((i) => [i.id, i]));
}

function receitaMap(receitas: ReceitaCalc[]): Map<string, ReceitaCalc> {
  return new Map(receitas.map((r) => [r.id, r]));
}

// ----------------------------------------------------------------
// Conversão de unidades
// ----------------------------------------------------------------

describe("converterUnidade", () => {
  it("kg para g", () => expect(converterUnidade(1, "kg", "g")).toBe(1000));
  it("g para kg", () => expect(converterUnidade(500, "g", "kg")).toBe(0.5));
  it("l para ml", () => expect(converterUnidade(2, "l", "ml")).toBe(2000));
  it("ml para l", () => expect(converterUnidade(250, "ml", "l")).toBe(0.25));
  it("mesma unidade", () => expect(converterUnidade(5, "g", "g")).toBe(5));
  it("unidade diferente lança erro", () =>
    expect(() => converterUnidade(1, "g", "ml")).toThrow());
});

// ----------------------------------------------------------------
// Custo unitário
// ----------------------------------------------------------------

describe("custoUnitario", () => {
  it("saco de 5 kg por R$20 = R$0,004/g", () => {
    const insumo: InsumoCalc = {
      id: "1",
      preco_pago: 20,
      qtd_por_embalagem: 5000, // 5 kg em gramas
      unidade_base: "g",
      fator_correcao: 1,
    };
    expect(custoUnitario(insumo)).toBeCloseTo(0.004);
  });

  it("litro de óleo R$8 = R$0,008/ml", () => {
    const insumo: InsumoCalc = {
      id: "2",
      preco_pago: 8,
      qtd_por_embalagem: 1000,
      unidade_base: "ml",
      fator_correcao: 1,
    };
    expect(custoUnitario(insumo)).toBeCloseTo(0.008);
  });
});

// ----------------------------------------------------------------
// Custo de item com fator de correção e conversão
// ----------------------------------------------------------------

describe("custoItem com insumo", () => {
  const insumo: InsumoCalc = {
    id: "farinha",
    preco_pago: 5,
    qtd_por_embalagem: 1000, // 1 kg = 1000 g
    unidade_base: "g",
    fator_correcao: 1.1, // 10% de perda
  };
  const insumos = insumoMap([insumo]);

  it("200 g líquidos com fator 1,1 = 220 g brutos × R$0,005", () => {
    const item: ItemReceitaCalc = {
      insumo_id: "farinha",
      sub_receita_id: null,
      qtd_liquida: 200,
      unidade: "g",
    };
    // custo unitário = 5/1000 = 0,005
    // qtd bruta = 200 * 1,1 = 220
    // custo = 220 * 0,005 = 1,10
    expect(custoItem(item, insumos, new Map())).toBeCloseTo(1.1);
  });

  it("conversão kg→g: 0,2 kg = 200 g", () => {
    const item: ItemReceitaCalc = {
      insumo_id: "farinha",
      sub_receita_id: null,
      qtd_liquida: 0.2,
      unidade: "kg",
    };
    expect(custoItem(item, insumos, new Map())).toBeCloseTo(1.1);
  });
});

// ----------------------------------------------------------------
// Sub-receitas aninhadas e detecção de ciclo
// ----------------------------------------------------------------

describe("custoSubReceita", () => {
  const insumoTomate: InsumoCalc = {
    id: "tomate",
    preco_pago: 4,
    qtd_por_embalagem: 1000,
    unidade_base: "g",
    fator_correcao: 1,
  };

  const molho: ReceitaCalc = {
    id: "molho",
    rendimento: 500, // ml
    unidade_rendimento: "ml",
    itens: [
      { insumo_id: "tomate", sub_receita_id: null, qtd_liquida: 300, unidade: "g" },
    ],
  };
  // Custo tomate: 4/1000 = 0,004/g × 300g = 1,20
  // Custo por ml do molho: 1,20/500 = 0,0024

  it("calcula custo total da sub-receita", () => {
    expect(
      custoSubReceita(molho, insumoMap([insumoTomate]), new Map())
    ).toBeCloseTo(1.2);
  });

  it("usa sub-receita em outra receita", () => {
    const prato: ReceitaCalc = {
      id: "prato",
      rendimento: 1,
      unidade_rendimento: "un",
      itens: [
        { insumo_id: null, sub_receita_id: "molho", qtd_liquida: 100, unidade: "ml" },
      ],
    };
    // 100 ml de molho × (1,20/500) = 0,24
    const custo = custoItem(
      prato.itens[0],
      insumoMap([insumoTomate]),
      receitaMap([molho])
    );
    expect(custo).toBeCloseTo(0.24);
  });

  it("detecta referência circular", () => {
    const srA: ReceitaCalc = {
      id: "srA",
      rendimento: 1,
      unidade_rendimento: "un",
      itens: [{ insumo_id: null, sub_receita_id: "srB", qtd_liquida: 1, unidade: "un" }],
    };
    const srB: ReceitaCalc = {
      id: "srB",
      rendimento: 1,
      unidade_rendimento: "un",
      itens: [{ insumo_id: null, sub_receita_id: "srA", qtd_liquida: 1, unidade: "un" }],
    };
    expect(() =>
      custoSubReceita(srA, new Map(), receitaMap([srA, srB]))
    ).toThrow(/circular/i);
  });
});

// ----------------------------------------------------------------
// Custo por porção
// ----------------------------------------------------------------

describe("custoPorcao", () => {
  const insumo: InsumoCalc = {
    id: "carne",
    preco_pago: 60,
    qtd_por_embalagem: 1000,
    unidade_base: "g",
    fator_correcao: 1,
  };

  it("2 porções de 200 g de carne = R$12/porção", () => {
    const receita: ReceitaCalc = {
      id: "r1",
      rendimento: 2,
      unidade_rendimento: "porções",
      itens: [
        { insumo_id: "carne", sub_receita_id: null, qtd_liquida: 400, unidade: "g" },
      ],
    };
    // custo total: 400g × 0,06/g = 24; por porção: 24/2 = 12
    expect(custoPorcao(receita, insumoMap([insumo]), new Map())).toBeCloseTo(12);
  });
});

// ----------------------------------------------------------------
// Precificação
// ----------------------------------------------------------------

describe("precoSugerido", () => {
  it("exemplo do spec: custo 12, 6%+3%+55% = R$33,33", () => {
    const pcts: PctCanal = {
      pct_impostos: 0.06,
      pct_taxa_cartao: 0.03,
      pct_comissao: 0,
      pct_margem_desejada: 0.55,
    };
    expect(precoSugerido(12, pcts)).toBeCloseTo(33.33, 1);
  });

  it("iFood 23%: custo 12 → R$92,31", () => {
    const pcts: PctCanal = {
      pct_impostos: 0.06,
      pct_taxa_cartao: 0.03,
      pct_comissao: 0.23,
      pct_margem_desejada: 0.55,
    };
    expect(precoSugerido(12, pcts)).toBeCloseTo(92.31, 1);
  });

  it("lança erro quando denominador <= 0", () => {
    const pcts: PctCanal = {
      pct_impostos: 0.5,
      pct_taxa_cartao: 0.3,
      pct_comissao: 0.1,
      pct_margem_desejada: 0.2,
    };
    expect(() => precoSugerido(10, pcts)).toThrow();
  });
});

describe("margemContribuicao", () => {
  it("preço 33,33, custo 12, 9% variáveis = R$18,33", () => {
    const m = margemContribuicao(33.33, 12, {
      pct_impostos: 0.06,
      pct_taxa_cartao: 0.03,
      pct_comissao: 0,
    });
    // 33,33 - 12 - 33,33*0,09 = 33,33 - 12 - 3,00 = 18,33
    expect(m).toBeCloseTo(18.33, 1);
  });
});

describe("cmvPct", () => {
  it("custo 12, preço 33,33 ≈ 36%", () => {
    expect(cmvPct(12, 33.33)).toBeCloseTo(0.36, 2);
  });
  it("preço zero retorna zero", () => {
    expect(cmvPct(5, 0)).toBe(0);
  });
});

// ----------------------------------------------------------------
// Impacto em cascata
// ----------------------------------------------------------------

describe("impactoAlteracao", () => {
  const insumo: InsumoCalc = {
    id: "queijo",
    preco_pago: 30,
    qtd_por_embalagem: 1000,
    unidade_base: "g",
    fator_correcao: 1,
  };

  const receita: ReceitaCalc = {
    id: "pizza",
    rendimento: 1,
    unidade_rendimento: "un",
    itens: [
      { insumo_id: "queijo", sub_receita_id: null, qtd_liquida: 200, unidade: "g" },
    ],
  };

  const pcts: PctCanal = {
    pct_impostos: 0.06,
    pct_taxa_cartao: 0.03,
    pct_comissao: 0,
    pct_margem_desejada: 0.55,
  };

  const precosPorReceita = new Map([
    ["pizza", [{ canal_id: "salao", preco_venda: 40, pcts }]],
  ]);

  it("retorna o prato afetado com custo novo correto", () => {
    const resultados = impactoAlteracao(
      "queijo",
      40, // preço subiu de 30 para 40
      [receita],
      insumoMap([insumo]),
      new Map(),
      precosPorReceita
    );
    expect(resultados).toHaveLength(1);
    // custo original: 200g × (30/1000) = 6
    expect(resultados[0].custo_anterior).toBeCloseTo(6);
    // custo novo: 200g × (40/1000) = 8
    expect(resultados[0].custo_novo).toBeCloseTo(8);
  });

  it("não retorna pratos que não usam o insumo", () => {
    const outroInsumo: InsumoCalc = {
      id: "frango",
      preco_pago: 20,
      qtd_por_embalagem: 1000,
      unidade_base: "g",
      fator_correcao: 1,
    };
    const resultados = impactoAlteracao(
      "frango",
      25,
      [receita],
      insumoMap([insumo, outroInsumo]),
      new Map(),
      precosPorReceita
    );
    expect(resultados).toHaveLength(0);
  });

  it("detecta insumo usado via sub-receita", () => {
    const molho: ReceitaCalc = {
      id: "molho",
      rendimento: 100,
      unidade_rendimento: "ml",
      itens: [
        { insumo_id: "queijo", sub_receita_id: null, qtd_liquida: 50, unidade: "g" },
      ],
    };
    const pratoDerived: ReceitaCalc = {
      id: "macarrao",
      rendimento: 1,
      unidade_rendimento: "un",
      itens: [
        { insumo_id: null, sub_receita_id: "molho", qtd_liquida: 50, unidade: "ml" },
      ],
    };
    const precos2 = new Map([
      ["macarrao", [{ canal_id: "salao", preco_venda: 35, pcts }]],
    ]);
    const resultados = impactoAlteracao(
      "queijo",
      40,
      [pratoDerived],
      insumoMap([insumo]),
      receitaMap([molho]),
      precos2
    );
    expect(resultados).toHaveLength(1);
    expect(resultados[0].receita_id).toBe("macarrao");
  });
});
