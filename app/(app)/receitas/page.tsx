import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NovaReceitaDialog } from "./NovaReceitaDialog";
import { LixeiraReceitas } from "./LixeiraReceitas";
import { custoPorcao, cmvPct } from "@/lib/calculos";
import { formatarMoeda, formatarPct } from "@/lib/formatacao";
import type { InsumoCalc, ReceitaCalc, ItemReceitaCalc } from "@/lib/calculos";
import { getAssinaturaAtiva } from "@/lib/assinaturas";

type PrecoCanalRow = { canal_id: string; preco_venda: number };
const TIPO_LABEL: Record<string, string> = {
  prato: "Prato", lanche: "Lanche", petisco: "Petisco", sub_receita: "Sub-receita",
};

type ReceitaRow = {
  id: string; nome: string; tipo: string; rendimento: number; unidade_rendimento: string;
  itens_receita: ItemReceitaCalc[];
  precos_canal: PrecoCanalRow[];
};
type CanalRow = { id: string; nome: string; pct_comissao: number };
type RestauranteRow = { pct_impostos: number; pct_taxa_cartao: number; pct_margem_minima: number };

export default async function ReceitasPage() {
  const supabase = await createClient();

  const [
    { data: receitasRaw },
    { data: insumosRaw },
    { data: subReceitasRaw },
    { data: canaisRaw },
    { data: restauranteRaw },
    { data: arquivadasRaw },
  ] = await Promise.all([
    supabase
      .from("receitas")
      .select("*, itens_receita!itens_receita_receita_id_fkey(*), precos_canal(*)")
      .eq("arquivado", false)
      .neq("tipo", "sub_receita")
      .order("nome"),
    supabase.from("insumos").select("*").eq("arquivado", false),
    supabase
      .from("receitas")
      .select("*, itens_receita!itens_receita_receita_id_fkey(*)")
      .eq("arquivado", false)
      .eq("tipo", "sub_receita")
      .order("nome"),
    supabase.from("canais_venda").select("*").eq("ativo", true).order("nome"),
    supabase.from("restaurantes").select("*").limit(1).maybeSingle(),
    supabase.from("receitas").select("id, nome, tipo").eq("arquivado", true).order("nome"),
  ]);

  const receitas = (receitasRaw ?? []) as unknown as ReceitaRow[];
  const subReceitas = (subReceitasRaw ?? []) as unknown as ReceitaRow[];
  const canais = (canaisRaw ?? []) as unknown as CanalRow[];
  const restaurante = restauranteRaw as unknown as RestauranteRow | null;

  const restauranteId = (restauranteRaw as unknown as { id?: string } | null)?.id;
  const assinatura = restauranteId ? await getAssinaturaAtiva(restauranteId) : null;
  const maxReceitas = assinatura?.max_receitas ?? null;

  const insumoMap = new Map<string, InsumoCalc>(
    (insumosRaw ?? []).map((i) => [i.id, i as InsumoCalc])
  );
  const srMap = new Map<string, ReceitaCalc>(
    subReceitas.map((r) => [
      r.id,
      { id: r.id, rendimento: r.rendimento, unidade_rendimento: r.unidade_rendimento, itens: r.itens_receita },
    ])
  );
  const canalMap = new Map<string, CanalRow>(canais.map((c) => [c.id, c]));

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Receitas</h1>
          {maxReceitas !== null && (
            <Badge variant={receitas.length >= maxReceitas ? "destructive" : "secondary"} className="text-xs">
              {receitas.length}/{maxReceitas} fichas
            </Badge>
          )}
        </div>
        <NovaReceitaDialog />
      </div>

      {subReceitas.length > 0 && (
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">Sub-receitas</p>
          <div className="flex flex-wrap gap-2">
            {subReceitas.map((sr) => (
              <Link key={sr.id} href={`/receitas/${sr.id}`}>
                <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                  {sr.nome}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Rendimento</TableHead>
              <TableHead>Custo/porção</TableHead>
              <TableHead>Preço de venda</TableHead>
              <TableHead>Margem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receitas.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nenhuma receita cadastrada.
                </TableCell>
              </TableRow>
            )}
            {receitas.map((receita) => {
              const rec: ReceitaCalc = {
                id: receita.id,
                rendimento: receita.rendimento,
                unidade_rendimento: receita.unidade_rendimento,
                itens: receita.itens_receita,
              };
              let custo: number | null = null;
              try { custo = custoPorcao(rec, insumoMap, srMap); } catch { /* ok */ }

              // Primeiro canal com preço cadastrado
              const precosCom = receita.precos_canal.filter((p) => p.preco_venda > 0);
              const primeiroPreco = precosCom[0] ?? null;
              const canal = primeiroPreco ? canalMap.get(primeiroPreco.canal_id) : null;

              // Margem efetiva
              let margemEfetivaPct: number | null = null;
              let abaixoMargem = false;
              if (custo !== null && primeiroPreco && canal && restaurante) {
                const preco = primeiroPreco.preco_venda;
                const pctVariaveis = restaurante.pct_impostos + restaurante.pct_taxa_cartao + canal.pct_comissao;
                const cmv = cmvPct(custo, preco);
                margemEfetivaPct = (1 - cmv - pctVariaveis) * 100;
                abaixoMargem = margemEfetivaPct < restaurante.pct_margem_minima * 100;
              }

              return (
                <TableRow key={receita.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link href={`/receitas/${receita.id}`} className="font-medium hover:underline">
                        {receita.nome}
                      </Link>
                      {receita.tipo !== "prato" && (
                        <Badge variant="outline" className="text-[10px] py-0">{TIPO_LABEL[receita.tipo] ?? receita.tipo}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {receita.rendimento} {receita.unidade_rendimento}
                  </TableCell>
                  <TableCell>
                    {custo !== null
                      ? <span className="tabular-nums">{formatarMoeda(custo)}</span>
                      : <span className="text-muted-foreground">—</span>
                    }
                  </TableCell>
                  <TableCell>
                    {primeiroPreco ? (
                      <div className="flex items-center gap-1.5">
                        <span className="tabular-nums font-medium">{formatarMoeda(primeiroPreco.preco_venda)}</span>
                        {canal && <Badge variant="outline" className="text-[10px] py-0">{canal.nome}</Badge>}
                        {precosCom.length > 1 && (
                          <span className="text-[10px] text-muted-foreground">+{precosCom.length - 1}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Não cadastrado</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {margemEfetivaPct !== null ? (
                      <span className={abaixoMargem ? "text-destructive font-medium" : "text-green-600 font-medium"}>
                        {margemEfetivaPct.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <LixeiraReceitas receitas={arquivadasRaw ?? []} />
    </div>
  );
}
