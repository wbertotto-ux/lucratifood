"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ChevronLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { salvarItensReceita, salvarPrecosCanal, atualizarReceita, arquivarReceita } from "@/lib/actions/receitas";
import { custoPorcao, precoSugerido, margemContribuicao, cmvPct } from "@/lib/calculos";
import type { InsumoCalc, ReceitaCalc, ItemReceitaCalc } from "@/lib/calculos";
import { formatarMoeda, formatarPct } from "@/lib/formatacao";
import Link from "next/link";

type Insumo = InsumoCalc & { nome: string; unidade_compra: string; categorias_insumo?: { nome: string } | null };
type SubReceita = { id: string; nome: string; rendimento: number; unidade_rendimento: string; itens_receita: ItemReceitaCalc[] };
type Canal = { id: string; nome: string; pct_comissao: number };
type Restaurante = { pct_impostos: number; pct_taxa_cartao: number; pct_margem_minima: number };

interface ItemForm {
  id?: string;
  insumo_id: string | null;
  sub_receita_id: string | null;
  qtd_liquida: number;
  unidade: string;
  tipo: "insumo" | "sub_receita";
}

interface PrecoForm {
  canal_id: string;
  preco_venda: number;
  embalagem_insumo_id: string | null;
}

interface Props {
  receita: { id: string; nome: string; tipo: string; rendimento: number; unidade_rendimento: string; modo_preparo: string | null; pct_margem_desejada: number | null; itens_receita: ItemReceitaCalc[]; precos_canal: PrecoForm[] };
  insumos: Insumo[];
  subReceitas: SubReceita[];
  canais: Canal[];
  restaurante: Restaurante;
  custoOperacionalPorPorcao?: number;
}

export function FichaTecnicaEditor({ receita, insumos, subReceitas, canais, restaurante, custoOperacionalPorPorcao = 0 }: Props) {
  const router = useRouter();
  const [nome, setNome] = useState(receita.nome);
  const [rendimento, setRendimento] = useState(String(receita.rendimento));
  const [unidadeRendimento, setUnidadeRendimento] = useState(receita.unidade_rendimento);
  const [modoPreparo, setModoPreparo] = useState(receita.modo_preparo ?? "");
  const [itens, setItens] = useState<ItemForm[]>(
    receita.itens_receita.map((i) => ({
      ...i,
      tipo: i.insumo_id ? "insumo" : "sub_receita",
    }))
  );
  const [precos, setPrecos] = useState<PrecoForm[]>(
    canais.map((c) => {
      const ex = receita.precos_canal.find((p) => p.canal_id === c.id);
      return ex ?? { canal_id: c.id, preco_venda: 0, embalagem_insumo_id: null };
    })
  );
  const [margemDesejada, setMargemDesejada] = useState(
    receita.pct_margem_desejada != null ? String(Math.round(receita.pct_margem_desejada * 100)) : ""
  );
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const [buscaInsumo, setBuscaInsumo] = useState("");

  const insumoMap = new Map<string, InsumoCalc>(insumos.map((i) => [i.id, i]));
  const srMap = new Map<string, ReceitaCalc>(
    subReceitas.map((sr) => [
      sr.id,
      { id: sr.id, rendimento: sr.rendimento, unidade_rendimento: sr.unidade_rendimento, itens: sr.itens_receita },
    ])
  );

  const recCalc: ReceitaCalc = {
    id: receita.id,
    rendimento: parseFloat(rendimento) || 1,
    unidade_rendimento: unidadeRendimento,
    itens: itens.map((i) => ({
      insumo_id: i.insumo_id,
      sub_receita_id: i.sub_receita_id,
      qtd_liquida: i.qtd_liquida,
      unidade: i.unidade,
    })),
  };

  let custoIngredientes: number = 0;
  try { custoIngredientes = custoPorcao(recCalc, insumoMap, srMap); } catch { /* ok */ }
  const custo = custoIngredientes + custoOperacionalPorPorcao;

  function addItem(tipo: "insumo" | "sub_receita", id: string) {
    const insumo = tipo === "insumo" ? insumos.find((i) => i.id === id) : null;
    const sr = tipo === "sub_receita" ? subReceitas.find((s) => s.id === id) : null;
    const unidade = insumo?.unidade_base ?? sr?.unidade_rendimento ?? "g";
    setItens((prev) => [
      ...prev,
      {
        insumo_id: tipo === "insumo" ? id : null,
        sub_receita_id: tipo === "sub_receita" ? id : null,
        qtd_liquida: 0,
        unidade,
        tipo,
      },
    ]);
    setBuscaInsumo("");
  }

  function removeItem(idx: number) {
    setItens((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateItemQtd(idx: number, qtd: string) {
    setItens((prev) => prev.map((item, i) => i === idx ? { ...item, qtd_liquida: parseFloat(qtd) || 0 } : item));
  }

  function updateItemUnidade(idx: number, unidade: string) {
    setItens((prev) => prev.map((item, i) => i === idx ? { ...item, unidade } : item));
  }

  function updatePreco(canalId: string, valor: string) {
    setPrecos((prev) => prev.map((p) => p.canal_id === canalId ? { ...p, preco_venda: parseFloat(valor) || 0 } : p));
  }

  async function salvar() {
    setErroSalvar(null);
    const itensInvalidos = itens.filter((i) => !i.qtd_liquida || i.qtd_liquida <= 0);
    if (itensInvalidos.length > 0) {
      setErroSalvar("Preencha a quantidade de todos os ingredientes antes de salvar.");
      return;
    }
    setSalvando(true);
    const fd = new FormData();
    fd.append("nome", nome);
    fd.append("rendimento", rendimento);
    fd.append("unidade_rendimento", unidadeRendimento);
    fd.append("modo_preparo", modoPreparo);
    if (margemDesejada !== "") fd.append("pct_margem_desejada", String(parseFloat(margemDesejada) / 100));
    await atualizarReceita(receita.id, fd);
    await salvarItensReceita(
      receita.id,
      itens.map((i) => ({
        insumo_id: i.insumo_id,
        sub_receita_id: i.sub_receita_id,
        qtd_liquida: i.qtd_liquida,
        unidade: i.unidade,
      }))
    );
    await salvarPrecosCanal(receita.id, precos);
    setSalvando(false);
    router.refresh();
  }

  const idsJaAdicionados = new Set(itens.map((i) => i.insumo_id ?? i.sub_receita_id).filter(Boolean));

  // Deduplica por nome (caso o banco tenha duplicatas) e filtra pela busca
  const insumosSemDupl = Array.from(
    new Map(insumos.filter(i => i.nome?.trim()).map(i => [i.nome.trim().toLowerCase(), i])).values()
  );
  const insumosFiltrados = insumosSemDupl.filter((i) =>
    i.nome.toLowerCase().includes(buscaInsumo.toLowerCase())
  );

  const subReceitasSemDupl = Array.from(
    new Map(subReceitas.filter(s => s.nome?.trim()).map(s => [s.nome.trim().toLowerCase(), s])).values()
  );
  const subReceitasFiltradas = subReceitasSemDupl.filter((sr) =>
    sr.nome.toLowerCase().includes(buscaInsumo.toLowerCase())
  );

  const nomeItem = useCallback((item: ItemForm) => {
    if (item.insumo_id) return insumos.find((i) => i.id === item.insumo_id)?.nome ?? "?";
    return subReceitas.find((s) => s.id === item.sub_receita_id)?.nome ?? "?";
  }, [insumos, subReceitas]);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl">
      <div className="sticky top-14 md:top-0 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-background border-b mb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/receitas">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold">{receita.nome}</h1>
            <Badge variant={receita.tipo === "sub_receita" ? "secondary" : "default"}>
              {{ prato: "Prato", lanche: "Lanche", petisco: "Petisco", sub_receita: "Sub-receita" }[receita.tipo] ?? receita.tipo}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={async () => {
              if (!confirm(`Arquivar "${receita.nome}"? A receita pode ser restaurada pela lixeira.`)) return;
              await arquivarReceita(receita.id);
              router.push("/receitas");
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button onClick={salvar} disabled={salvando}>
            <Save className="w-4 h-4 mr-1" />
            {salvando ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </div>

      {erroSalvar && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{erroSalvar}</p>
      )}

      <Tabs defaultValue="ingredientes">
        <TabsList>
          <TabsTrigger value="ingredientes">Ingredientes</TabsTrigger>
          <TabsTrigger value="precos">Preços por canal</TabsTrigger>
          <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
        </TabsList>

        <TabsContent value="ingredientes" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Nome da receita</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Rendimento</Label>
              <Input type="number" step="0.01" value={rendimento} onChange={(e) => setRendimento(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Unidade</Label>
              <Input value={unidadeRendimento} onChange={(e) => setUnidadeRendimento(e.target.value)} />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            {itens.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum ingrediente adicionado ainda.</p>
            )}
            {itens.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-muted/40 rounded-md px-3 py-2">
                <span className="flex-1 text-sm font-medium">{nomeItem(item)}</span>
                {item.tipo === "sub_receita" && <Badge variant="secondary" className="text-xs">sub-receita</Badge>}
                <Input
                  type="number"
                  step="any"
                  className="w-24 h-7 text-sm"
                  value={item.qtd_liquida || ""}
                  onChange={(e) => updateItemQtd(idx, e.target.value)}
                />
                <Input
                  className="w-16 h-7 text-sm"
                  value={item.unidade}
                  onChange={(e) => updateItemUnidade(idx, e.target.value)}
                />
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => removeItem(idx)}>
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Input
              placeholder="Buscar ingrediente ou sub-receita para adicionar…"
              value={buscaInsumo}
              onChange={(e) => setBuscaInsumo(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setBuscaInsumo("")}
            />
            {buscaInsumo.length > 0 && (
              <div className="border rounded-md shadow-md max-h-56 overflow-y-auto bg-popover">
                {insumosFiltrados.length === 0 && subReceitasFiltradas.length === 0 && (
                  <p className="px-3 py-3 text-sm text-muted-foreground">Nenhum resultado para "{buscaInsumo}".</p>
                )}
                {insumosFiltrados.map((i) => {
                  const jaAdicionado = idsJaAdicionados.has(i.id);
                  return (
                    <button
                      key={i.id}
                      type="button"
                      disabled={jaAdicionado}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => !jaAdicionado && addItem("insumo", i.id)}
                    >
                      {jaAdicionado
                        ? <span className="text-xs text-muted-foreground">✓</span>
                        : <Plus className="w-3.5 h-3.5 shrink-0" />
                      }
                      <span className="flex-1">{i.nome}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{i.unidade_base}</span>
                      {jaAdicionado && <span className="text-[10px] text-muted-foreground shrink-0">já adicionado</span>}
                    </button>
                  );
                })}
                {subReceitasFiltradas.map((sr) => {
                  const jaAdicionado = idsJaAdicionados.has(sr.id);
                  return (
                    <button
                      key={sr.id}
                      type="button"
                      disabled={jaAdicionado}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => !jaAdicionado && addItem("sub_receita", sr.id)}
                    >
                      {jaAdicionado
                        ? <span className="text-xs text-muted-foreground">✓</span>
                        : <Plus className="w-3.5 h-3.5 shrink-0" />
                      }
                      <span className="flex-1">{sr.nome}</span>
                      <Badge variant="secondary" className="ml-auto text-xs shrink-0">sub-receita</Badge>
                      {jaAdicionado && <span className="text-[10px] text-muted-foreground shrink-0">já adicionado</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {custoIngredientes > 0 && (
            <div className="bg-muted rounded-md p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ingredientes</span>
                <span>{formatarMoeda(custoIngredientes)}</span>
              </div>
              {custoOperacionalPorPorcao > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Operacional</span>
                  <span>{formatarMoeda(custoOperacionalPorPorcao)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold pt-1 border-t border-border">
                <span>Custo total/porção</span>
                <span className="text-primary">{formatarMoeda(custo)}</span>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="precos" className="space-y-4 pt-4">
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-1">
                  <Label className="text-sm font-semibold">Margem mínima para este prato (%)</Label>
                  <p className="text-xs text-muted-foreground">
                    Substitui a margem global ({Math.round(restaurante.pct_margem_minima * 100)}%) só para este prato. Deixe vazio para usar a global.
                  </p>
                </div>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  className="w-24"
                  placeholder={String(Math.round(restaurante.pct_margem_minima * 100))}
                  value={margemDesejada}
                  onChange={(e) => setMargemDesejada(e.target.value)}
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </CardContent>
          </Card>
          {canais.map((canal) => {
            const preco = precos.find((p) => p.canal_id === canal.id);
            const precoVenda = preco?.preco_venda ?? 0;
            const margemEfetiva = margemDesejada !== "" ? parseFloat(margemDesejada) / 100 : restaurante.pct_margem_minima;
            const pcts = { pct_impostos: restaurante.pct_impostos, pct_taxa_cartao: restaurante.pct_taxa_cartao, pct_comissao: canal.pct_comissao, pct_margem_desejada: margemEfetiva };
            let sugerido: number | null = null;
            let margem: number | null = null;
            let cmv: number | null = null;
            try {
              sugerido = precoSugerido(custo, pcts);
              if (precoVenda > 0) {
                margem = margemContribuicao(precoVenda, custo, pcts);
                cmv = cmvPct(custo, precoVenda);
              }
            } catch { /* ok */ }

            const abaixoMargem = margem !== null && precoVenda > 0 && cmv !== null && (1 - cmv - canal.pct_comissao - restaurante.pct_impostos - restaurante.pct_taxa_cartao) < margemEfetiva;

            return (
              <Card key={canal.id} className={abaixoMargem ? "border-destructive" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{canal.nome}</CardTitle>
                    {canal.pct_comissao > 0 && (
                      <Badge variant="outline">{formatarPct(canal.pct_comissao)} comissão</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Preço de venda (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={precoVenda || ""}
                        onChange={(e) => updatePreco(canal.id, e.target.value)}
                      />
                    </div>
                    {sugerido !== null && (
                      <div className="space-y-1">
                        <Label className="text-muted-foreground">Preço sugerido</Label>
                        <p className="text-sm font-semibold text-primary pt-2">{formatarMoeda(sugerido)}</p>
                      </div>
                    )}
                  </div>
                  {precoVenda > 0 && margem !== null && cmv !== null && (
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>CMV: <strong className={abaixoMargem ? "text-destructive" : ""}>{formatarPct(cmv)}</strong></span>
                      <span>Margem: <strong className={abaixoMargem ? "text-destructive" : "text-green-600"}>{formatarMoeda(margem)}</strong></span>
                      {abaixoMargem && <Badge variant="destructive" className="text-xs">Abaixo da margem mínima</Badge>}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="detalhes" className="space-y-4 pt-4">
          <div className="space-y-1">
            <Label>Modo de preparo</Label>
            <Textarea
              value={modoPreparo}
              onChange={(e) => setModoPreparo(e.target.value)}
              rows={6}
              placeholder="Descreva o modo de preparo…"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
