"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getAssinaturaAtiva } from "@/lib/assinaturas";

export async function atualizarRestaurante(formData: FormData) {
  const supabase = await createClient();
  const { data: rest } = await supabase.from("restaurantes").select("id").limit(1).maybeSingle();
  if (!rest) return;

  await supabase.from("restaurantes").update({
    nome: formData.get("nome") as string,
    pct_impostos: parseFloat(formData.get("pct_impostos") as string) / 100,
    pct_taxa_cartao: parseFloat(formData.get("pct_taxa_cartao") as string) / 100,
    pct_margem_minima: parseFloat(formData.get("pct_margem_minima") as string) / 100,
  }).eq("id", rest.id);

  revalidatePath("/configuracoes");
  revalidatePath("/dashboard");
  revalidatePath("/receitas", "layout");
  revalidatePath("/impacto", "layout");
}

export async function criarCanal(formData: FormData) {
  const supabase = await createClient();
  const { data: rest } = await supabase.from("restaurantes").select("id").limit(1).maybeSingle();
  if (!rest) return;

  const limites = await getAssinaturaAtiva(rest.id);
  if (limites?.max_canais != null) {
    const { count } = await supabase
      .from("canais_venda")
      .select("id", { count: "exact", head: true })
      .eq("restaurante_id", rest.id)
      .eq("ativo", true);
    if ((count ?? 0) >= limites.max_canais) {
      throw new Error(`LIMITE_PLANO:canais:${limites.max_canais}`);
    }
  }

  await supabase.from("canais_venda").insert({
    restaurante_id: rest.id,
    nome: formData.get("nome") as string,
    pct_comissao: parseFloat(formData.get("pct_comissao") as string) / 100,
  });
  revalidatePath("/configuracoes");
}

export async function atualizarCanal(id: string, formData: FormData) {
  const supabase = await createClient();
  await supabase.from("canais_venda").update({
    nome: formData.get("nome") as string,
    pct_comissao: parseFloat(formData.get("pct_comissao") as string) / 100,
    ativo: formData.get("ativo") === "true",
  }).eq("id", id);
  revalidatePath("/configuracoes");
}

export async function criarCategoria(nome: string) {
  const supabase = await createClient();
  const { data: rest } = await supabase.from("restaurantes").select("id").limit(1).maybeSingle();
  if (!rest) return;

  await supabase.from("categorias_insumo").insert({ restaurante_id: rest.id, nome });
  revalidatePath("/configuracoes");
}

export async function excluirCategoria(id: string): Promise<{ erro: string } | undefined> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("insumos")
    .select("id", { count: "exact", head: true })
    .eq("categoria_id", id)
    .eq("arquivado", false);
  if ((count ?? 0) > 0) {
    return { erro: `Não é possível excluir: ${count} insumo${count === 1 ? "" : "s"} ${count === 1 ? "usa" : "usam"} essa categoria. Reatribua-${count === 1 ? "o" : "os"} antes.` };
  }
  await supabase.from("categorias_insumo").delete().eq("id", id);
  revalidatePath("/configuracoes");
}

export async function criarCustoOperacional(formData: FormData) {
  const supabase = await createClient();
  const { data: rest } = await supabase.from("restaurantes").select("id").limit(1).maybeSingle();
  if (!rest) return;
  await supabase.from("custos_operacionais").insert({
    restaurante_id: rest.id,
    categoria: formData.get("categoria") as string,
    descricao: formData.get("descricao") as string,
    valor_mensal: parseFloat(formData.get("valor_mensal") as string),
  });
  revalidatePath("/configuracoes");
}

export async function atualizarCustoOperacional(id: string, formData: FormData) {
  const supabase = await createClient();
  await supabase.from("custos_operacionais").update({
    descricao: formData.get("descricao") as string,
    valor_mensal: parseFloat(formData.get("valor_mensal") as string),
  }).eq("id", id);
  revalidatePath("/configuracoes");
}

export async function excluirCustoOperacional(id: string) {
  const supabase = await createClient();
  await supabase.from("custos_operacionais").delete().eq("id", id);
  revalidatePath("/configuracoes");
}

export async function atualizarPorcoesMes(porcoes: number) {
  const supabase = await createClient();
  const { data: rest } = await supabase.from("restaurantes").select("id").limit(1).maybeSingle();
  if (!rest) return;
  await supabase.from("restaurantes").update({ porcoes_mes_estimado: porcoes }).eq("id", rest.id);
  revalidatePath("/configuracoes");
  revalidatePath("/dashboard");
}
