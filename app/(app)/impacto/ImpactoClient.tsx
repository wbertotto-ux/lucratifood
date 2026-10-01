"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { salvarPrecosCanal } from "@/lib/actions/receitas";
import { formatarMoeda, formatarPct } from "@/lib/formatacao";
import type { ResultadoImpacto } from "@/lib/calculos";

interface Canal { id: string; nome: string }
interface Receita { id: string; nome: string }

interface Props {
  resultados: ResultadoImpacto[];
  canais: Canal[];
  receitas: Receita[];
  insumoNome: string;
  novoPreco: number;
  precoAnterior: number;
}

export function ImpactoClient({ resultados, canais, receitas, insumoNome, novoPreco, precoAnterior }: Props) {
  const [aplicando, setAplicando] = useState(false);
  const [aplicados, setAplicados] = useState<string[]>([]);

  const nomeCanal = (id: string) => canais.find((c) => c.id === id)?.nome ?? id;
  const nomeReceita = (id: string) => receitas.find((r) => r.id === id)?.nome ?? id;

  async function aplicarTodos() {
    setAplicando(true);
    const porReceita = new Map<string, { canal_id: string; preco_venda: number; embalagem_insumo_id: null }[]>();
    for (const r of resultados) {
      const lista = porReceita.get(r.receita_id) ?? [];
      lista.push({ canal_id: r.canal_id, preco_venda: r.preco_sugerido_novo, embalagem_insumo_id: null });
      porReceita.set(r.receita_id, lista);
    }
    for (const [receitaId, precos] of porReceita) {
      await salvarPrecosCanal(receitaId, precos);
      setAplicados((prev) => [...prev, receitaId]);
    }
    setAplicando(false);
  }

  const variacaoPreco = ((novoPreco - precoAnterior) / precoAnterior) * 100;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/insumos">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold">Impacto da alteração de preço</h1>
          <p className="text-sm text-muted-foreground">
            {insumoNome}: {formatarMoeda(precoAnterior)} → {formatarMoeda(novoPreco)}
            {" "}
            <span className={variacaoPreco > 0 ? "text-destructive" : "text-green-600"}>
              ({variacaoPreco > 0 ? "+" : ""}{variacaoPreco.toFixed(1)}%)
            </span>
          </p>
        </div>
      </div>

      {resultados.length === 0 ? (
        <p className="text-muted-foreground">Nenhum prato foi afetado por esta alteração.</p>
      ) : (
        <>
          <div className="flex justify-end">
            <Button onClick={aplicarTodos} disabled={aplicando}>
              {aplicando ? "Aplicando…" : `Aplicar todos os preços sugeridos (${resultados.length})`}
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prato</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Custo anterior</TableHead>
                  <TableHead>Custo novo</TableHead>
                  <TableHead>Variação de margem</TableHead>
                  <TableHead>Preço sugerido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resultados.map((r, i) => {
                  const deltaMargem = r.margem_nova - r.margem_anterior;
                  const foiAplicado = aplicados.includes(r.receita_id);
                  return (
                    <TableRow key={i}>
                      <TableCell>
                        <Link href={`/receitas/${r.receita_id}`} className="font-medium hover:underline">
                          {nomeReceita(r.receita_id)}
                        </Link>
                        {foiAplicado && <Badge variant="secondary" className="ml-2 text-xs">Atualizado</Badge>}
                      </TableCell>
                      <TableCell>{nomeCanal(r.canal_id)}</TableCell>
                      <TableCell>{formatarMoeda(r.custo_anterior)}</TableCell>
                      <TableCell className="font-medium">{formatarMoeda(r.custo_novo)}</TableCell>
                      <TableCell>
                        <span className={deltaMargem < 0 ? "text-destructive font-medium" : "text-green-600 font-medium"}>
                          {deltaMargem < 0 ? <TrendingDown className="inline w-3.5 h-3.5 mr-1" /> : <TrendingUp className="inline w-3.5 h-3.5 mr-1" />}
                          {deltaMargem < 0 ? "" : "+"}{formatarMoeda(deltaMargem)}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold text-primary">
                        {formatarMoeda(r.preco_sugerido_novo)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
