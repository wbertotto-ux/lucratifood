import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { FichaTecnicaEditor } from "./FichaTecnicaEditor";

export const dynamic = "force-dynamic";

export default async function FichaTecnicaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: receita },
    { data: insumos },
    { data: subReceitas },
    { data: canais },
    { data: restaurante },
    { data: custosOp },
  ] = await Promise.all([
    supabase
      .from("receitas")
      .select("*, itens_receita!itens_receita_receita_id_fkey(*), precos_canal(*)")
      .eq("id", id)
      .single(),
    supabase.from("insumos").select("*").eq("arquivado", false).order("nome"),
    supabase
      .from("receitas")
      .select("id, nome, rendimento, unidade_rendimento, itens_receita!itens_receita_receita_id_fkey(*)")
      .eq("arquivado", false)
      .eq("tipo", "sub_receita")
      .neq("id", id)
      .order("nome"),
    supabase.from("canais_venda").select("*").eq("ativo", true).order("nome"),
    supabase.from("restaurantes").select("*").limit(1).maybeSingle(),
    supabase.from("custos_operacionais").select("valor_mensal, ativo"),
  ]);

  if (!receita) notFound();

  const totalOpMensal = (custosOp ?? []).filter(c => c.ativo).reduce((s, c) => s + Number(c.valor_mensal), 0);
  const porcoesMes = (restaurante as { porcoes_mes_estimado?: number } | null)?.porcoes_mes_estimado ?? 300;
  const custoOperacionalPorPorcao = porcoesMes > 0 ? totalOpMensal / porcoesMes : 0;

  // Deduplica canais por nome; prefere o que já tem preço salvo para esta receita
  const precosIds = new Set((receita.precos_canal ?? []).map((p: { canal_id: string }) => p.canal_id));
  const canaisUnicos = Array.from(
    new Map(
      (canais ?? [])
        .filter((c: { nome?: string }) => c.nome?.trim())
        .sort((a: { id: string }, b: { id: string }) =>
          (precosIds.has(b.id) ? 1 : 0) - (precosIds.has(a.id) ? 1 : 0)
        )
        .map((c: { nome: string; id: string }) => [c.nome.trim().toLowerCase(), c])
    ).values()
  );

  return (
    <FichaTecnicaEditor
      receita={receita}
      insumos={insumos ?? []}
      subReceitas={subReceitas ?? []}
      canais={canaisUnicos}
      restaurante={restaurante!}
      custoOperacionalPorPorcao={custoOperacionalPorPorcao}
    />
  );
}
