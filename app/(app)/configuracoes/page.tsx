import { createClient } from "@/lib/supabase/server";
import { ConfiguracoesClient } from "./ConfiguracoesClient";

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const [{ data: restaurante }, { data: canais }, { data: categorias }, { data: custosOp }] = await Promise.all([
    supabase.from("restaurantes").select("*").limit(1).maybeSingle(),
    supabase.from("canais_venda").select("*").order("nome"),
    supabase.from("categorias_insumo").select("*").order("nome"),
    supabase.from("custos_operacionais").select("*").order("categoria").order("descricao"),
  ]);

  if (!restaurante) return null;

  // Deduplica canais por nome — prefere ativo, depois maior comissão
  const canaisDedup = Array.from(
    new Map(
      (canais ?? [])
        .filter((c) => c.nome?.trim())
        .sort((a, b) => {
          if (a.ativo !== b.ativo) return a.ativo ? -1 : 1;
          return b.pct_comissao - a.pct_comissao;
        })
        .map((c) => [c.nome.trim().toLowerCase(), c])
    ).values()
  );

  // Deduplica categorias por nome
  const categoriasDedup = Array.from(
    new Map(
      (categorias ?? [])
        .filter((c) => c.nome?.trim())
        .map((c) => [c.nome.trim().toLowerCase(), c])
    ).values()
  );

  return (
    <ConfiguracoesClient
      restaurante={restaurante}
      canais={canaisDedup}
      categorias={categoriasDedup}
      custosOperacionais={custosOp ?? []}
    />
  );
}
