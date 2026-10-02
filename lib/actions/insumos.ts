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

export async function criarInsumo(formData: FormData) {
  const supabase = await createClient();
  const restaurante_id = await getRestauranteId();

  const limites = await getAssinaturaAtiva(restaurante_id);
  if (limites?.max_insumos != null) {
    const { count } = await supabase
      .from("insumos")
      .select("id", { count: "exact", head: true })
      .eq("restaurante_id", restaurante_id)
      .eq("arquivado", false);
    if ((count ?? 0) >= limites.max_insumos) {
      throw new Error(`LIMITE_PLANO:insumos:${limites.max_insumos}`);
    }
  }

  const payload = {
    restaurante_id,
    nome: formData.get("nome") as string,
    categoria_id: (formData.get("categoria_id") as string) || null,
    unidade_compra: formData.get("unidade_compra") as string,
    qtd_por_embalagem: parseFloat(formData.get("qtd_por_embalagem") as string),
    unidade_base: formData.get("unidade_base") as "g" | "ml" | "un",
    preco_pago: parseFloat(formData.get("preco_pago") as string),
    fornecedor: (formData.get("fornecedor") as string) || null,
    fator_correcao: parseFloat((formData.get("fator_correcao") as string) || "1"),
    observacoes: (formData.get("observacoes") as string) || null,
    arquivado: false,
  };

  const { error } = await supabase.from("insumos").insert(payload);
  if (error) throw new Error(error.message);

  revalidatePath("/insumos");
}

export async function atualizarInsumo(id: string, formData: FormData) {
  const supabase = await createClient();

  const precoNovo = parseFloat(formData.get("preco_pago") as string);

  const { error } = await supabase
    .from("insumos")
    .update({
      nome: formData.get("nome") as string,
      categoria_id: (formData.get("categoria_id") as string) || null,
      unidade_compra: formData.get("unidade_compra") as string,
      qtd_por_embalagem: parseFloat(formData.get("qtd_por_embalagem") as string),
      unidade_base: formData.get("unidade_base") as "g" | "ml" | "un",
      preco_pago: precoNovo,
      fornecedor: (formData.get("fornecedor") as string) || null,
      fator_correcao: parseFloat((formData.get("fator_correcao") as string) || "1"),
      observacoes: (formData.get("observacoes") as string) || null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/insumos");
}

export async function arquivarInsumo(id: string) {
  const supabase = await createClient();
  await supabase.from("insumos").update({ arquivado: true }).eq("id", id);
  revalidatePath("/insumos");
}

export async function duplicarInsumo(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("insumos").select("*").eq("id", id).single();
  if (!data) return;

  const restaurante_id = await getRestauranteId();
  const limites = await getAssinaturaAtiva(restaurante_id);
  if (limites?.max_insumos != null) {
    const { count } = await supabase
      .from("insumos")
      .select("id", { count: "exact", head: true })
      .eq("restaurante_id", restaurante_id)
      .eq("arquivado", false);
    if ((count ?? 0) >= limites.max_insumos) {
      throw new Error(`LIMITE_PLANO:insumos:${limites.max_insumos}`);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _, atualizado_em: __, ...resto } = data;
  await supabase.from("insumos").insert({ ...resto, nome: `${data.nome} (cópia)` });
  revalidatePath("/insumos");
}

export async function atualizarPrecosEmLote(
  updates: { id: string; preco_pago: number }[]
) {
  const supabase = await createClient();
  await Promise.all(
    updates.map(({ id, preco_pago }) =>
      supabase.from("insumos").update({ preco_pago }).eq("id", id)
    )
  );
  revalidatePath("/insumos");
}
