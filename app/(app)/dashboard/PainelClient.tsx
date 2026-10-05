"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell, Legend,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrendingDown, TrendingUp, AlertTriangle, Trash2, BarChart2, ArrowUpRight, Lock } from "lucide-react";
import { precoSugerido, margemContribuicao, cmvPct } from "@/lib/calculos";
import { formatarMoeda, formatarPct } from "@/lib/formatacao";
import { arquivarReceita } from "@/lib/actions/receitas";
import { PlanoGate } from "@/components/PlanoGate";

type Canal = { id: string; nome: string; pct_comissao: number };
type Restaurante = { pct_impostos: number; pct_taxa_cartao: number; pct_margem_minima: number };
type Prato = {
  id: string;
  nome: string;
  custo: number;
  rendimento: number;
  unidade_rendimento: string;
  precos_canal: { canal_id: string; preco_venda: number }[];
};

interface Props {
  pratos: Prato[];
  canais: Canal[];
  restaurante: Restaurante;
  restauranteId: string;
  custoOperacionalPorPorcao?: number;
  planoId?: string;
}

type Ordenacao = "nome" | "custo" | "margem" | "cmv";

const COR_OK = "#16a34a";
const COR_ABAIXO = "#dc2626";
const COR_CUSTO = "#f97316";
const COR_DEDUCOES = "#94a3b8";
const COR_MARGEM = "#2563eb";

function nomeAbreviado(nome: string, max = 14) {
  return nome.length > max ? nome.slice(0, max) + "…" : nome;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TooltipMoeda({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-md px-3 py-2 text-xs shadow-md space-y-1">
      <p className="font-semibold text-foreground">{label}</p>
      {payload.map((entry: { name: string; value: number; color: string }, i: number) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === "number" && entry.name.includes("%")
            ? `${entry.value.toFixed(1)}%`
            : formatarMoeda(entry.value)}
        </p>
      ))}
    </div>
  );
}

export function PainelClient({ pratos, canais, restaurante, restauranteId, custoOperacionalPorPorcao = 0, planoId = "essencial" }: Props) {
  const isPro = planoId === "pro";
  const router = useRouter();

  // Deduplica canais por nome antes de qualquer estado derivado
  const canaisUnicos = useMemo(() =>
    Array.from(new Map(canais.filter(c => c.nome?.trim()).map(c => [c.nome.trim().toLowerCase(), c])).values()),
    [canais]
  );

  const salaoId = useMemo(() =>
    canaisUnicos.find(c => /sal[aã]o/i.test(c.nome))?.id ?? canaisUnicos[0]?.id ?? "",
    [canaisUnicos]
  );

  const [canalSelecionado, setCanalSelecionado] = useState(() => {
    const salao = canaisUnicos.find(c => /sal[aã]o/i.test(c.nome));
    return salao?.id ?? canaisUnicos[0]?.id ?? "";
  });
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("nome");

  // Garante que a seleção sempre aponta para um canal válido, preferindo Salão
  useEffect(() => {
    if (canaisUnicos.length > 0 && !canaisUnicos.find((c) => c.id === canalSelecionado)) {
      setCanalSelecionado(salaoId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canaisUnicos]);
  const [mediasVendas, setMediasVendas] = useState<Record<string, string>>({});

  const storageKey = `medias_vendas_mes_${restauranteId}`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setMediasVendas(JSON.parse(saved));
    } catch { /* ok */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  function setMedia(id: string, val: string) {
    const novo = { ...mediasVendas, [id]: val };
    setMediasVendas(novo);
    try { localStorage.setItem(storageKey, JSON.stringify(novo)); } catch { /* ok */ }
  }

  const canal = canaisUnicos.find((c) => c.id === canalSelecionado);

  const pratosCalculados = useMemo(() => {
    if (!canal) return [];
    return pratos.map((prato) => {
      const precoCanal = prato.precos_canal.find((p) => p.canal_id === canal.id);
      const preco = precoCanal?.preco_venda ?? 0;
      const pcts = {
        pct_impostos: restaurante.pct_impostos,
        pct_taxa_cartao: restaurante.pct_taxa_cartao,
        pct_comissao: canal.pct_comissao,
        pct_margem_desejada: restaurante.pct_margem_minima,
      };
      let sugerido = 0;
      try { sugerido = precoSugerido(prato.custo, pcts); } catch { /* ok */ }
      const margem = preco > 0 ? margemContribuicao(preco, prato.custo, pcts) : null;
      const cmv = preco > 0 ? cmvPct(prato.custo, preco) : null;
      const pctVariaveis = restaurante.pct_impostos + restaurante.pct_taxa_cartao + canal.pct_comissao;
      const margemEfetiva = preco > 0 ? 1 - cmvPct(prato.custo, preco) - pctVariaveis : null;
      const abaixoMargem = margemEfetiva !== null && margemEfetiva < restaurante.pct_margem_minima;
      const mediaVendas = parseInt(mediasVendas[prato.id] ?? "0") || 0;
      const receitaProjetada = preco > 0 && mediaVendas > 0 ? preco * mediaVendas : null;
      const lucroProjetado = margem !== null && mediaVendas > 0 ? margem * mediaVendas : null;
      return { ...prato, preco, sugerido, margem, cmv, abaixoMargem, margemEfetiva, mediaVendas, receitaProjetada, lucroProjetado };
    });
  }, [pratos, canal, restaurante, mediasVendas]);

  const pratosOrdenados = useMemo(() => {
    return [...pratosCalculados].sort((a, b) => {
      if (ordenacao === "nome") return a.nome.localeCompare(b.nome);
      if (ordenacao === "custo") return a.custo - b.custo;
      if (ordenacao === "margem") return (a.margem ?? -Infinity) - (b.margem ?? -Infinity);
      if (ordenacao === "cmv") return (a.cmv ?? 1) - (b.cmv ?? 1);
      return 0;
    });
  }, [pratosCalculados, ordenacao]);

  const totalPratos = pratosCalculados.length;
  const pratosAbaixo = pratosCalculados.filter((p) => p.abaixoMargem).length;
  const melhorMargem = pratosCalculados.filter((p) => p.margem !== null).sort((a, b) => (b.margem ?? 0) - (a.margem ?? 0))[0];

  // Dados para gráfico 1: ranking de margem %
  const dadosMargem = [...pratosCalculados]
    .filter((p) => p.margemEfetiva !== null)
    .sort((a, b) => (b.margemEfetiva ?? 0) - (a.margemEfetiva ?? 0))
    .map((p) => ({
      nome: nomeAbreviado(p.nome),
      "Margem %": parseFloat(((p.margemEfetiva ?? 0) * 100).toFixed(1)),
      abaixo: p.abaixoMargem,
    }));

  // Dados para gráfico 2: custo vs preço (stacked)
  const dadosCusto = pratosCalculados
    .filter((p) => p.preco > 0)
    .map((p) => ({
      nome: nomeAbreviado(p.nome),
      Custo: parseFloat(p.custo.toFixed(2)),
      Deduções: parseFloat((p.preco * (restaurante.pct_impostos + restaurante.pct_taxa_cartao + (canal?.pct_comissao ?? 0))).toFixed(2)),
      Margem: parseFloat((p.margem && p.margem > 0 ? p.margem : 0).toFixed(2)),
    }));

  // Dados para gráfico 3: ranking de lucratividade (margem absoluta R$)
  const dadosLucratividade = [...pratosCalculados]
    .filter((p) => p.margem !== null && p.preco > 0)
    .sort((a, b) => (b.margem ?? 0) - (a.margem ?? 0))
    .map((p) => ({
      nome: nomeAbreviado(p.nome),
      "Lucro/porção": parseFloat((p.margem ?? 0).toFixed(2)),
      positivo: (p.margem ?? 0) >= 0,
    }));

  // Projeção mensal
  const temProjecao = pratosCalculados.some((p) => p.mediaVendas > 0);
  const receitaTotalProjetada = pratosCalculados.reduce((s, p) => s + (p.receitaProjetada ?? 0), 0);
  const lucroTotalProjetado = pratosCalculados.reduce((s, p) => s + (p.lucroProjetado ?? 0), 0);

  const dadosProjecao = pratosCalculados
    .filter((p) => p.mediaVendas > 0)
    .map((p) => ({
      nome: nomeAbreviado(p.nome),
      "Receita": parseFloat((p.receitaProjetada ?? 0).toFixed(2)),
      "Lucro": parseFloat((p.lucroProjetado ?? 0).toFixed(2)),
    }));

  const margemMinimaRef = parseFloat((restaurante.pct_margem_minima * 100).toFixed(1));

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">Painel de margens</h1>
        <div className="flex gap-3">
          <Select value={canalSelecionado} onValueChange={(v) => {
            if (!v) return;
            const bloqueado = !isPro && v !== salaoId;
            if (!bloqueado) setCanalSelecionado(v);
          }}>
            <SelectTrigger className="w-40">
              <span className="truncate text-sm">{canal?.nome ?? "Canal"}</span>
            </SelectTrigger>
            <SelectContent>
              {canaisUnicos.map((c) => {
                const bloqueado = !isPro && c.id !== salaoId;
                return (
                  <SelectItem
                    key={c.id}
                    value={c.id}
                    disabled={bloqueado}
                    className={bloqueado ? "opacity-50" : ""}
                  >
                    <span className="flex items-center gap-2">
                      {c.nome}
                      {bloqueado && <Lock className="w-3 h-3 text-muted-foreground" />}
                    </span>
                  </SelectItem>
                );
              })}
              {!isPro && canaisUnicos.length > 1 && (
                <div className="border-t mt-1 pt-1 px-2 pb-1">
                  <Link href="/conta" className="flex items-center gap-1 text-xs text-primary hover:underline">
                    <ArrowUpRight className="w-3 h-3" />
                    Upgrade PRO para trocar de canal
                  </Link>
                </div>
              )}
            </SelectContent>
          </Select>
          <Select value={ordenacao} onValueChange={(v) => v && setOrdenacao(v as Ordenacao)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nome">Ordenar por nome</SelectItem>
              <SelectItem value="custo">Ordenar por custo</SelectItem>
              <SelectItem value="margem">Ordenar por margem</SelectItem>
              <SelectItem value="cmv">Ordenar por CMV</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {custoOperacionalPorPorcao > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-md px-4 py-2 text-sm text-muted-foreground">
          Custo operacional incluído: <span className="font-semibold text-foreground">{formatarMoeda(custoOperacionalPorPorcao)}/porção</span>
        </div>
      )}

      {/* Cards resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total de pratos</p>
            <p className="text-2xl font-semibold">{totalPratos}</p>
          </CardContent>
        </Card>
        <Card className={pratosAbaixo > 0 ? "border-destructive" : ""}>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-destructive" /> Abaixo da margem mínima
            </p>
            <p className="text-2xl font-semibold text-destructive">{pratosAbaixo}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-green-600" /> Maior margem
            </p>
            <p className="text-base font-semibold text-green-600">
              {melhorMargem ? `${melhorMargem.nome} (${melhorMargem.margem !== null ? formatarMoeda(melhorMargem.margem) : "—"})` : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      {dadosMargem.length > 0 && (
        <PlanoGate
          planoId={planoId}
          feature="Gráficos de análise — disponível no PRO"
          teaser="Veja o ranking de margem, composição de preço e lucratividade do cardápio com dados em tempo real."
        >
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Gráfico 1: Ranking de margem % */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-primary" /> Ranking de Margem (%)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={Math.max(180, dadosMargem.length * 44)}>
                  <BarChart data={dadosMargem} layout="vertical" margin={{ top: 4, right: 32, left: 8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" unit="%" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="nome" tick={{ fontSize: 12 }} width={90} tickLine={false} axisLine={false} />
                    <Tooltip content={<TooltipMoeda />} />
                    <ReferenceLine x={margemMinimaRef} stroke={COR_ABAIXO} strokeDasharray="4 2" label={{ value: `Mín ${margemMinimaRef}%`, position: "top", fontSize: 10, fill: COR_ABAIXO }} />
                    <Bar dataKey="Margem %" radius={[0, 4, 4, 0]}>
                      {dadosMargem.map((entry, i) => (
                        <Cell key={i} fill={entry.abaixo ? COR_ABAIXO : COR_OK} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: COR_OK }} /> Acima da mínima</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: COR_ABAIXO }} /> Abaixo da mínima</span>
                </div>
              </CardContent>
            </Card>

            {/* Gráfico 2: Custo vs preço breakdown */}
            {dadosCusto.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-primary" /> Composição do Preço (R$)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={Math.max(180, dadosCusto.length * 44)}>
                    <BarChart data={dadosCusto} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
                      <YAxis type="category" dataKey="nome" tick={{ fontSize: 12 }} width={90} tickLine={false} axisLine={false} />
                      <Tooltip content={<TooltipMoeda />} />
                      <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="Custo" stackId="a" fill={COR_CUSTO} radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Deduções" stackId="a" fill={COR_DEDUCOES} />
                      <Bar dataKey="Margem" stackId="a" fill={COR_MARGEM} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Gráfico 3: Ranking de lucratividade absoluta (R$/porção) */}
          {dadosLucratividade.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" /> Lucratividade do Cardápio (R$/porção)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={Math.max(180, dadosLucratividade.length * 44)}>
                  <BarChart data={dadosLucratividade} layout="vertical" margin={{ top: 4, right: 48, left: 8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
                    <YAxis type="category" dataKey="nome" tick={{ fontSize: 12 }} width={90} tickLine={false} axisLine={false} />
                    <Tooltip content={<TooltipMoeda />} />
                    <ReferenceLine x={0} stroke="hsl(var(--border))" />
                    <Bar dataKey="Lucro/porção" radius={[0, 4, 4, 0]}>
                      {dadosLucratividade.map((entry, i) => (
                        <Cell key={i} fill={entry.positivo ? COR_OK : COR_ABAIXO} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: COR_OK }} /> Lucrativo</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: COR_ABAIXO }} /> Prejuízo</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        </PlanoGate>
      )}

      {/* Tabela */}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Prato</TableHead>
              <TableHead>Custo/porção</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>CMV</TableHead>
              <TableHead>Margem contribuição</TableHead>
              <TableHead>
                <span className="block leading-tight">Vendas/mês</span>
                <span className="text-[10px] font-normal text-muted-foreground">média estimada</span>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pratosOrdenados.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Nenhum prato cadastrado. <Link href="/receitas" className="underline">Criar receita</Link>
                </TableCell>
              </TableRow>
            )}
            {pratosOrdenados.map((prato) => (
              <TableRow key={prato.id} className={prato.abaixoMargem ? "bg-destructive/5" : ""}>
                <TableCell>
                  <Link href={`/receitas/${prato.id}`} className="font-medium hover:underline">
                    {prato.nome}
                  </Link>
                </TableCell>
                <TableCell>{formatarMoeda(prato.custo)}</TableCell>
                <TableCell>
                  {prato.preco > 0
                    ? formatarMoeda(prato.preco)
                    : <span className="text-muted-foreground text-sm">Não cadastrado</span>
                  }
                </TableCell>
                <TableCell>
                  {prato.cmv !== null
                    ? <span className={prato.abaixoMargem ? "text-destructive font-medium" : ""}>{formatarPct(prato.cmv)}</span>
                    : <span className="text-muted-foreground">—</span>
                  }
                </TableCell>
                <TableCell>
                  {prato.margem !== null
                    ? <span className={prato.margem < 0 ? "text-destructive font-medium" : "text-green-600 font-medium"}>{formatarMoeda(prato.margem)}</span>
                    : <span className="text-muted-foreground">—</span>
                  }
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={mediasVendas[prato.id] ?? ""}
                    onChange={(e) => setMedia(prato.id, e.target.value)}
                    className="w-20 h-7 text-sm"
                  />
                </TableCell>
                <TableCell>
                  {prato.abaixoMargem ? (
                    <Badge variant="destructive" className="text-xs">
                      <TrendingDown className="w-3 h-3 mr-1" /> Abaixo
                    </Badge>
                  ) : prato.preco > 0 ? (
                    <Badge variant="secondary" className="text-xs">OK</Badge>
                  ) : null}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={async () => {
                      if (!confirm(`Arquivar "${prato.nome}"? A receita pode ser restaurada pela lixeira em Receitas.`)) return;
                      await arquivarReceita(prato.id);
                      router.refresh();
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Projeção mensal */}
      {temProjecao && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Receita projetada/mês</p>
                <p className="text-2xl font-bold text-primary">{formatarMoeda(receitaTotalProjetada)}</p>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Lucro projetado/mês</p>
                <p className="text-2xl font-bold text-green-600">{formatarMoeda(lucroTotalProjetado)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Projeção por Prato (R$/mês)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={Math.max(160, dadosProjecao.length * 44)}>
                <BarChart data={dadosProjecao} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
                  <YAxis type="category" dataKey="nome" tick={{ fontSize: 12 }} width={90} tickLine={false} axisLine={false} />
                  <Tooltip content={<TooltipMoeda />} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Receita" fill={COR_MARGEM} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Lucro" fill={COR_OK} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
