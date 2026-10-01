import { createClient } from "@/lib/supabase/server";

export type LimitesPlano = {
  plano_id: string;
  plano_nome: string;
  max_receitas: number | null;
  max_insumos: number | null;
  max_canais: number | null;
};

// Dev bypass: set BYPASS_SUBSCRIPTION=true to skip subscription check locally
const BYPASS = process.env.BYPASS_SUBSCRIPTION === "true";

export async function getAssinaturaAtiva(restauranteId: string): Promise<LimitesPlano | null> {
  if (BYPASS) {
    return { plano_id: "pro", plano_nome: "PRO", max_receitas: null, max_insumos: null, max_canais: null };
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("assinaturas")
    .select("plano_id, planos(nome, max_receitas, max_insumos, max_canais)")
    .eq("restaurante_id", restauranteId)
    .eq("status", "ativo")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  const planoRaw = Array.isArray(data.planos) ? data.planos[0] : data.planos;
  const plano = (planoRaw as unknown) as {
    nome: string;
    max_receitas: number | null;
    max_insumos: number | null;
    max_canais: number | null;
  } | null;

  return {
    plano_id: data.plano_id,
    plano_nome: plano?.nome ?? data.plano_id,
    max_receitas: plano?.max_receitas ?? null,
    max_insumos: plano?.max_insumos ?? null,
    max_canais: plano?.max_canais ?? null,
  };
}
