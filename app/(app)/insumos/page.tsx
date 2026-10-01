import { createClient } from "@/lib/supabase/server";
import { InsumosClient } from "./InsumosClient";
import { getAssinaturaAtiva } from "@/lib/assinaturas";

type InsumoRow = {
  id: string; nome: string; categoria_id: string | null; unidade_compra: string;
  qtd_por_embalagem: number; unidade_base: "g" | "ml" | "un"; preco_pago: number;
  fator_correcao: number; fornecedor: string | null; observacoes: string | null;
  arquivado: boolean; atualizado_em: string;
  categorias_insumo: { nome: string } | null;
};

export default async function InsumosPage() {
  const supabase = await createClient();

  const [{ data: insumosRaw }, { data: categorias }, { data: restaurante }] = await Promise.all([
    supabase.from("insumos").select("*, categorias_insumo(nome)").eq("arquivado", false).order("nome"),
    supabase.from("categorias_insumo").select("*").order("nome"),
    supabase.from("restaurantes").select("id").limit(1).maybeSingle(),
  ]);

  const insumos = (insumosRaw ?? []) as unknown as InsumoRow[];
  const restauranteId = (restaurante as unknown as { id: string } | null)?.id ?? "";
  const assinatura = restauranteId ? await getAssinaturaAtiva(restauranteId) : null;
  const maxInsumos = assinatura?.max_insumos ?? null;

  return (
    <InsumosClient
      insumosIniciais={insumos}
      categorias={categorias ?? []}
      restauranteId={restauranteId}
      maxInsumos={maxInsumos}
    />
  );
}
