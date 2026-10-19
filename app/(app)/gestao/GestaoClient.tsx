"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
  LineChart, Line, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlanoGate } from "@/components/PlanoGate";
import { salvarVendasMes, type VendaMes } from "@/lib/actions/gestao";
import { formatarMoeda, formatarPct } from "@/lib/formatacao";
import { Check, TrendingUp, TrendingDown, DollarSign, ShoppingCart } from "lucide-react";

type Prato = {
  id: string;
  nome: string;
  custo: number;
  precos_canal: { canal_id: string; preco_venda: number }[];
};

type Canal = { id: string; nome: string; pct_comissao: number };
type Restaurante = { pct_impostos: number; pct_taxa_cartao: number };

interface Props {
  pratos: Prato[];
  canais: Canal[];
  restaurante: Restaurante;
  restauranteId: string;
  planoId: string;
  mes: string;
  vendasExistentes: VendaMes[];
}

// Combinações prato × canal que têm preço cadastrado
type LinhaLancamento = {
  chave: string; // `${receita_id}|${canal_id}`
  receita_id: string;
  canal_id: string;
  prato: string;
  canal: string;
  custo: number;
  preco_unitario: number;
  pct_impostos: number;
  pct_taxa_cartao: number;
  pct_comissao: number;
  quantidade: number;
};

function mesLabel(mes: string) {
  const [ano, m] = mes.split("-");
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${meses[parseInt(m) - 1]}/${ano}`;
}

function mesesAnteriores(n: number): string[] {
  const resultado: string[] = [];
  const d = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const dt = new Date(d.getFullYear(), d.getMonth() - i, 1);
    resultado.push(dt.toISOString().slice(0, 7));
  }
  return resultado;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TooltipMoeda({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-md px-3 py-2 text-xs shadow-md space-y-1">
      <p className="font-semibold text-foreground">{label}</p>
      {payload.map((e: { name: string; value: number; color: string }, i: number) => (
        <p key={i} style={{ color: e.color }}>{e.name}: {formatarMoeda(e.value)}</p>
      ))}
    </div>
  );
}

const CORES_CANAL = ["#2563eb", "#16a34a", "#d97706", "#9333ea", "#e11d48"];

export function GestaoClient({
  pratos, canais, restaurante, restauranteId, planoId, mes: mesInicial, vendasExistentes,
}: Props) {
  const isPro = planoId === "pro";
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [salvo, setSalvo] = useState(false);
  const [mes, setMes] = useState(mesInicial);

  // ── Monta linhas de lançamento (prato × canal com preço) ──────────
  const linhasBase = useMemo<LinhaLancamento[]>(() => {
    const linhas: LinhaLancamento[] = [];
    for (const prato of pratos) {
      for (const canal of canais) {
        const pc = prato.precos_canal.find((p) => p.canal_id === canal.id);
        if (!pc || pc.preco_venda <= 0) continue;
        const chave = `${prato.id}|${canal.id}`;
        const venda = vendasExistentes.find((v) => v.receita_id === prato.id && v.canal_id === canal.id);
        linhas.push({
          chave,
          receita_id: prato.id,
          canal_id: canal.id,
          prato: prato.nome,
          canal: canal.nome,
          custo: prato.custo,
          preco_unitario: venda ? venda.preco_unitario : pc.preco_venda,
          pct_impostos: restaurante.pct_impostos,
          pct_taxa_cartao: restaurante.pct_taxa_cartao,
          pct_comissao: canal.pct_comissao,
          quantidade: venda ? venda.quantidade : 0,
        });
      }
    }
    return linhas;
  }, [pratos, canais, restaurante, vendasExistentes]);

  const [linhas, setLinhas] = useState<LinhaLancamento[]>(linhasBase);

  function setQtd(chave: string, qtd: number) {
    setLinhas((prev) => prev.map((l) => l.chave === chave ? { ...l, quantidade: Math.max(0, qtd) } : l));
    setSalvo(false);
  }

  function setPreco(chave: string, preco: number) {
    setLinhas((prev) => prev.map((l) => l.chave === chave ? { ...l, preco_unitario: Math.max(0, preco) } : l));
    setSalvo(false);
  }

  function handleMesChange(novoMes: string) {
    setMes(novoMes);
    router.push(`/gestao?mes=${novoMes}`);
  }

  async function salvar() {
    const lancamentos = linhas.map((l) => ({
      receita_id: l.receita_id,
      canal_id: l.canal_id,
      mes,
      quantidade: l.quantidade,
      preco_unitario: l.preco_unitario,
    }));
    startTransition(async () => {
      await salvarVendasMes(lancamentos);
      setSalvo(true);
    });
  }

  // ── Cálculos do dashboard ─────────────────────────────────────────
  const dashboard = useMemo(() => {
    const linhasComVenda = linhas.filter((l) => l.quantidade > 0);

    let faturamentoBruto = 0;
    let custoTotal = 0;
    let margemTotal = 0;

    const porCanal: Record<string, { nome: string; faturamento: number; margem: number }> = {};
    const porPrato: Record<string, { nome: string; faturamento: number; margem: number; quantidade: number }> = {};

    for (const l of linhasComVenda) {
      const fatur = l.preco_unitario * l.quantidade;
      const custo = l.custo * l.quantidade;
      const deducoes = fatur * (l.pct_impostos + l.pct_taxa_cartao + l.pct_comissao);
      const margem = fatur - custo - deducoes;

      faturamentoBruto += fatur;
      custoTotal += custo;
      margemTotal += margem;

      if (!porCanal[l.canal_id]) porCanal[l.canal_id] = { nome: l.canal, faturamento: 0, margem: 0 };
      porCanal[l.canal_id].faturamento += fatur;
      porCanal[l.canal_id].margem += margem;

      if (!porPrato[l.receita_id]) porPrato[l.receita_id] = { nome: l.prato, faturamento: 0, margem: 0, quantidade: 0 };
      porPrato[l.receita_id].faturamento += fatur;
      porPrato[l.receita_id].margem += margem;
      porPrato[l.receita_id].quantidade += l.quantidade;
    }

    const cmvReal = faturamentoBruto > 0 ? custoTotal / faturamentoBruto : 0;

    const canalMaiorFaturamento = Object.values(porCanal).sort((a, b) => b.faturamento - a.faturamento)[0];
    const dadosCanal = Object.values(porCanal).map((c, i) => ({ ...c, fill: CORES_CANAL[i % CORES_CANAL.length] }));
    const rankingPratos = Object.values(porPrato)
      .sort((a, b) => b.margem - a.margem)
      .slice(0, 10)
      .map((p) => ({ ...p, nome: p.nome.length > 20 ? p.nome.slice(0, 20) + "…" : p.nome }));
    const top5Vendidos = Object.values(porPrato)
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);

    return { faturamentoBruto, custoTotal, margemTotal, cmvReal, canalMaiorFaturamento, dadosCanal, rankingPratos, top5Vendidos, temDados: linhasComVenda.length > 0 };
  }, [linhas]);

  // ── Dados para comparativo mensal (mockado com zeros para meses sem dados) ──
  const meses6 = mesesAnteriores(6);

  return (
    <div className="p-4 sm:p-6 max-w-5xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Gestão</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Lance as vendas do mês e veja o desempenho do seu negócio.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground whitespace-nowrap">Período:</label>
          <Input
            type="month"
            value={mes}
            onChange={(e) => handleMesChange(e.target.value)}
            className="w-40 text-sm"
          />
        </div>
      </div>

      <Tabs defaultValue="lancamentos">
        <TabsList>
          <TabsTrigger value="lancamentos">Lançamentos</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="comparativo">Comparativo</TabsTrigger>
        </TabsList>

        {/* ── ABA LANÇAMENTOS ─────────────────────────────────── */}
        <TabsContent value="lancamentos" className="space-y-4 mt-4">
          {linhas.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground text-center py-12">
                Nenhum prato com preço cadastrado por canal.{" "}
                <Link href="/receitas" className="text-primary underline underline-offset-4">Cadastre preços nas fichas técnicas</Link>.
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardContent className="pt-4 pb-2 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground border-b">
                        <th className="pb-2 font-medium pr-4 whitespace-nowrap">Prato</th>
                        <th className="pb-2 font-medium pr-4 whitespace-nowrap">Canal</th>
                        <th className="pb-2 font-medium pr-4 whitespace-nowrap text-right">Preço (R$)</th>
                        <th className="pb-2 font-medium text-right whitespace-nowrap">Qtd vendida</th>
                      </tr>
                    </thead>
                    <tbody>
                      {linhas.map((l) => (
                        <tr key={l.chave} className="border-b last:border-0">
                          <td className="py-2 pr-4 font-medium text-foreground max-w-[160px] truncate">{l.prato}</td>
                          <td className="py-2 pr-4">
                            <Badge variant="outline" className="text-xs">{l.canal}</Badge>
                          </td>
                          <td className="py-2 pr-4">
                            <Input
                              type="number"
                              min={0}
                              step={0.01}
                              value={l.preco_unitario}
                              onChange={(e) => setPreco(l.chave, parseFloat(e.target.value) || 0)}
                              className="w-24 h-7 text-right text-sm ml-auto"
                            />
                          </td>
                          <td className="py-2">
                            <Input
                              type="number"
                              min={0}
                              step={1}
                              value={l.quantidade === 0 ? "" : l.quantidade}
                              placeholder="0"
                              onChange={(e) => setQtd(l.chave, parseInt(e.target.value) || 0)}
                              className="w-24 h-7 text-right text-sm ml-auto"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              <div className="flex items-center gap-3">
                <Button onClick={salvar} disabled={isPending} className="gap-2">
                  {isPending ? "Salvando…" : salvo ? <><Check className="w-4 h-4" /> Salvo</> : "Salvar lançamentos"}
                </Button>
                {salvo && <span className="text-sm text-muted-foreground">Dados salvos para {mesLabel(mes)}.</span>}
              </div>

              {/* Cards resumo — disponíveis para todos os planos */}
              {dashboard.temDados && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                  {[
                    { label: "Faturamento bruto", value: formatarMoeda(dashboard.faturamentoBruto), icon: DollarSign, cor: "text-blue-600" },
                    { label: "CMV real", value: formatarPct(dashboard.cmvReal), icon: ShoppingCart, cor: dashboard.cmvReal > 0.4 ? "text-red-600" : "text-green-600" },
                    { label: "Margem de contribuição", value: formatarMoeda(dashboard.margemTotal), icon: dashboard.margemTotal >= 0 ? TrendingUp : TrendingDown, cor: dashboard.margemTotal >= 0 ? "text-green-600" : "text-red-600" },
                    { label: "Maior canal", value: dashboard.canalMaiorFaturamento?.nome ?? "—", icon: TrendingUp, cor: "text-primary" },
                  ].map(({ label, value, icon: Icon, cor }) => (
                    <Card key={label}>
                      <CardContent className="pt-4 pb-3 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Icon className={`w-4 h-4 ${cor}`} />
                          <p className="text-xs text-muted-foreground">{label}</p>
                        </div>
                        <p className={`text-lg font-bold ${cor}`}>{value}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ── ABA DASHBOARD ───────────────────────────────────── */}
        <TabsContent value="dashboard" className="space-y-6 mt-4">
          {!dashboard.temDados ? (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground text-center py-12">
                Lance as vendas do mês na aba Lançamentos para ver os gráficos.
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Cards resumo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Faturamento bruto", value: formatarMoeda(dashboard.faturamentoBruto), icon: DollarSign, cor: "text-blue-600" },
                  { label: "CMV real", value: formatarPct(dashboard.cmvReal), icon: ShoppingCart, cor: dashboard.cmvReal > 0.4 ? "text-red-600" : "text-green-600" },
                  { label: "Margem de contribuição", value: formatarMoeda(dashboard.margemTotal), icon: dashboard.margemTotal >= 0 ? TrendingUp : TrendingDown, cor: dashboard.margemTotal >= 0 ? "text-green-600" : "text-red-600" },
                  { label: "Maior canal", value: dashboard.canalMaiorFaturamento?.nome ?? "—", icon: TrendingUp, cor: "text-primary" },
                ].map(({ label, value, icon: Icon, cor }) => (
                  <Card key={label}>
                    <CardContent className="pt-4 pb-3 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Icon className={`w-4 h-4 ${cor}`} />
                        <p className="text-xs text-muted-foreground">{label}</p>
                      </div>
                      <p className={`text-lg font-bold ${cor}`}>{value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Gráficos — PRO */}
              <PlanoGate
                planoId={planoId}
                feature="Gráficos de performance"
                teaser="Veja faturamento por canal, ranking de lucratividade e top pratos. Disponível no PRO."
              >
                <div className="space-y-6">
                  {/* Faturamento por canal */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold">Faturamento por canal</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={dashboard.dadosCanal} layout="vertical" margin={{ left: 8, right: 24 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" tickFormatter={(v) => formatarMoeda(v)} tick={{ fontSize: 11 }} />
                          <YAxis type="category" dataKey="nome" tick={{ fontSize: 12 }} width={80} />
                          <Tooltip content={<TooltipMoeda />} />
                          <Bar dataKey="faturamento" name="Faturamento" radius={[0, 4, 4, 0]}>
                            {dashboard.dadosCanal.map((e, i) => (
                              <Cell key={i} fill={e.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Ranking de lucratividade */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold">Ranking de lucratividade (margem R$)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={Math.max(200, dashboard.rankingPratos.length * 36)}>
                        <BarChart data={dashboard.rankingPratos} layout="vertical" margin={{ left: 8, right: 24 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" tickFormatter={(v) => formatarMoeda(v)} tick={{ fontSize: 11 }} />
                          <YAxis type="category" dataKey="nome" tick={{ fontSize: 11 }} width={120} />
                          <Tooltip content={<TooltipMoeda />} />
                          <Bar dataKey="margem" name="Margem" radius={[0, 4, 4, 0]}>
                            {dashboard.rankingPratos.map((e, i) => (
                              <Cell key={i} fill={e.margem >= 0 ? "#2563eb" : "#dc2626"} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Top 5 mais vendidos */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold">Top 5 mais vendidos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {dashboard.top5Vendidos.map((p, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">{i + 1}</span>
                              <span className="font-medium truncate max-w-[200px]">{p.nome}</span>
                            </span>
                            <span className="text-muted-foreground shrink-0 ml-2">{p.quantidade} un · {formatarMoeda(p.faturamento)}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </PlanoGate>
            </>
          )}
        </TabsContent>

        {/* ── ABA COMPARATIVO ─────────────────────────────────── */}
        <TabsContent value="comparativo" className="mt-4">
          <PlanoGate
            planoId={planoId}
            feature="Comparativo mensal"
            teaser="Acompanhe a evolução do faturamento e da margem mês a mês. Disponível no PRO."
          >
            <ComparativoMensal meses={meses6} restauranteId={restauranteId} />
          </PlanoGate>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Sub-componente: Comparativo mensal (carrega dados dinamicamente) ──
function ComparativoMensal({ meses, restauranteId }: { meses: string[]; restauranteId: string }) {
  const [dados, setDados] = useState<{ mes: string; faturamento: number; margem: number }[]>([]);
  const [carregado, setCarregado] = useState(false);

  // Carrega via Server Action ao montar
  useState(() => {
    import("@/lib/actions/gestao").then(({ getVendasRange }) => {
      getVendasRange(meses).then((vendas) => {
        const agrupado = meses.map((m) => {
          const vendasMes = vendas.filter((v) => v.mes === m);
          const fat = vendasMes.reduce((s, v) => s + v.preco_unitario * v.quantidade, 0);
          // margem simplificada (sem deduções por canal aqui — apenas custo não disponível neste sub-componente)
          return { mes: mesLabel(m), faturamento: fat, margem: 0 };
        });
        setDados(agrupado);
        setCarregado(true);
      });
    });
  });

  if (!carregado) return <div className="text-sm text-muted-foreground p-4">Carregando…</div>;

  const temDados = dados.some((d) => d.faturamento > 0);

  if (!temDados) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground text-center py-12">
          Nenhum dado encontrado nos últimos 6 meses. Lance as vendas mensais para ver o comparativo.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Faturamento — últimos 6 meses</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={dados} margin={{ left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => formatarMoeda(v)} tick={{ fontSize: 10 }} width={80} />
            <Tooltip content={<TooltipMoeda />} />
            <Legend />
            <Line type="monotone" dataKey="faturamento" name="Faturamento" stroke="#2563eb" strokeWidth={2} dot />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
