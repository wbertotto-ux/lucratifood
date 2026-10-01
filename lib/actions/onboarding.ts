"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const CATEGORIAS_PADRAO = [
  "Hortifrúti",
  "Carnes",
  "Laticínios",
  "Secos e Grãos",
  "Bebidas",
  "Embalagens",
  "Limpeza e Descartáveis",
  "Outros",
];

const CANAIS_PADRAO = [
  { nome: "iFood", pct_comissao: 0.23 },
  { nome: "99", pct_comissao: 0 },
  { nome: "Salão", pct_comissao: 0 },
  { nome: "Saipos", pct_comissao: 0 },
  { nome: "Telefone", pct_comissao: 0 },
  { nome: "WhatsApp", pct_comissao: 0 },
];

export async function criarRestaurante(formData: FormData) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) redirect("/login");

  const nome = formData.get("nome") as string;
  const pct_impostos = parseFloat(formData.get("pct_impostos") as string) / 100;
  const pct_taxa_cartao = parseFloat(formData.get("pct_taxa_cartao") as string) / 100;
  const pct_margem_minima = parseFloat(formData.get("pct_margem_minima") as string) / 100;

  // Se já existe restaurante para esse usuário, apenas redireciona
  const { data: existente } = await supabase
    .from("restaurantes")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (existente) {
    // Verifica se já tem assinatura ativa
    const { data: assinaturaExistente } = await supabase
      .from("assinaturas")
      .select("status")
      .eq("restaurante_id", existente.id)
      .eq("status", "ativo")
      .maybeSingle();
    redirect(assinaturaExistente ? "/dashboard" : "/planos?pendente=1");
  }

  const { data: restaurante, error } = await supabase
    .from("restaurantes")
    .insert({ dono_id: user.id, nome, pct_impostos, pct_taxa_cartao, pct_margem_minima })
    .select()
    .single();

  if (error || !restaurante) {
    throw new Error("Erro ao criar restaurante");
  }

  await supabase.from("categorias_insumo").insert(
    CATEGORIAS_PADRAO.map((nome) => ({ restaurante_id: restaurante.id, nome }))
  );

  await supabase.from("canais_venda").insert(
    CANAIS_PADRAO.map((c) => ({ ...c, restaurante_id: restaurante.id }))
  );

  const plano = formData.get("plano") as string | null;
  redirect(`/checkout?plano=${plano ?? "essencial"}`);
}
