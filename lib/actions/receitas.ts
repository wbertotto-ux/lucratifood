"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAssinaturaAtiva } from "@/lib/assinaturas";

async function getRestauranteId() {
  const supabase = await createClient();
  const { data } = await supabase.from("restaurantes").select("id").limit(1).maybeSingle();
  if (!data) redirect("/onboarding");
  return data.id;
}

export async function criarReceita(formData: FormData) {
  const supabase = await createClient();
  const restaurante_id = await getRestauranteId();

  const limites = await getAssinaturaAtiva(restaurante_id);
  if (limites?.max_receitas != null) {
    const { count } = await supabase
      .from("receitas")
      .select("id", { count: "exact", head: true })
      .eq("restaurante_id", restaurante_id)
      .eq("arquivado", false)
      .eq("tipo", "prato");
    if ((count ?? 0) >= limites.max_receitas) {
      throw new Error(`LIMITE_PLANO:receitas:${limites.max_receitas}`);
    }
  }

  const { data: receita, error } = await supabase
    .from("receitas")
    .insert({
      restaurante_id,
      nome: formData.get("nome") as string,
      tipo: formData.get("tipo") as "prato" | "sub_receita",
      rendimento: parseFloat(formData.get("rendimento") as string),
      unidade_rendimento: formData.get("unidade_rendimento") as string,
      modo_preparo: (formData.get("modo_preparo") as string) || null,
    })
    .select()
    .single();

  if (error || !receita) throw new Error(error?.message ?? "Erro ao criar receita");

  revalidatePath("/receitas");
  return receita.id;
}

export async function atualizarReceita(id: string, formData: FormData) {
  const supabase = await createClient();
  const margemRaw = formData.get("pct_margem_desejada") as string | null;
  await supabase
    .from("receitas")
    .update({
      nome: formData.get("nome") as string,
      rendimento: parseFloat(formData.get("rendimento") as string),
      unidade_rendimento: formData.get("unidade_rendimento") as string,
      modo_preparo: (formData.get("modo_preparo") as string) || null,
      pct_margem_desejada: margemRaw ? parseFloat(margemRaw) : null,
    })
    .eq("id", id);
  revalidatePath(`/receitas/${id}`);
  revalidatePath("/receitas");
}

export async function salvarItensReceita(
  receitaId: string,
  itens: { insumo_id: string | null; sub_receita_id: string | null; qtd_liquida: number; unidade: string }[]
) {
  const supabase = await createClient();
  await supabase.from("itens_receita").delete().eq("receita_id", receitaId);
  if (itens.length > 0) {
    await supabase.from("itens_receita").insert(
      itens.map((i) => ({ ...i, receita_id: receitaId }))
    );
  }
  revalidatePath(`/receitas/${receitaId}`);
}

export async function salvarPrecosCanal(
  receitaId: string,
  precos: { canal_id: string; preco_venda: number; embalagem_insumo_id: string | null }[]
) {
  const supabase = await createClient();
  await supabase.from("precos_canal").delete().eq("receita_id", receitaId);
  if (precos.length > 0) {
    await supabase.from("precos_canal").insert(
      precos.map((p) => ({ ...p, receita_id: receitaId }))
    );
  }
  revalidatePath(`/receitas/${receitaId}`);
}

export async function arquivarReceita(id: string) {
  const supabase = await createClient();
  await supabase.from("receitas").update({ arquivado: true }).eq("id", id);
  revalidatePath("/receitas");
  revalidatePath("/dashboard");
}

export async function restaurarReceita(id: string) {
  const supabase = await createClient();
  await supabase.from("receitas").update({ arquivado: false }).eq("id", id);
  revalidatePath("/receitas");
  revalidatePath("/dashboard");
}

export async function excluirReceitaPermanentemente(id: string) {
  const supabase = await createClient();
  await supabase.from("itens_receita").delete().eq("receita_id", id);
  await supabase.from("precos_canal").delete().eq("receita_id", id);
  await supabase.from("receitas").delete().eq("id", id);
  revalidatePath("/receitas");
  revalidatePath("/dashboard");
}
