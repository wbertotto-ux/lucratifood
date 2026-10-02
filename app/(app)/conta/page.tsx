import { createClient } from "@/lib/supabase/server";
import { ContaClient } from "./ContaClient";

export const metadata = { title: "Minha Conta — Lucratifood" };

export default async function ContaPage() {
  const supabase = await createClient();

  const [
    { data: { user } },
    { data: restauranteRaw },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("restaurantes").select("*").limit(1).maybeSingle(),
  ]);

  const restaurante = restauranteRaw as {
    id: string; nome: string;
    pct_impostos: number; pct_taxa_cartao: number; pct_margem_minima: number;
  } | null;

  // Assinatura — busca separada do plano para evitar dependência do FK cache do PostgREST
  const { data: assinaturaRaw } = restaurante
    ? await supabase
        .from("assinaturas")
        .select("id, status, vigencia_ate, created_at, plano_id")
        .eq("restaurante_id", restaurante.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  const assinaturaBase = assinaturaRaw as {
    id: string; status: string; vigencia_ate: string | null; created_at: string; plano_id: string;
  } | null;

  const { data: planoRaw } = assinaturaBase?.plano_id
    ? await supabase.from("planos").select("id, nome, preco_mensal, max_receitas, max_insumos, max_canais").eq("id", assinaturaBase.plano_id).maybeSingle()
    : { data: null };

  const assinatura = assinaturaBase
    ? { ...assinaturaBase, planos: planoRaw as { id: string; nome: string; preco_mensal: number; max_receitas: number | null; max_insumos: number | null; max_canais: number | null } | null }
    : null;

  return (
    <ContaClient
      email={user?.email ?? ""}
      restaurante={restaurante}
      assinatura={assinatura}
    />
  );
}
