"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type VendaMes = {
  id: string;
  receita_id: string;
  canal_id: string;
  mes: string;
  quantidade: number;
  preco_unitario: number;
};

export type LancamentoInput = {
  receita_id: string;
  canal_id: string;
  mes: string;
  quantidade: number;
  preco_unitario: number;
};

export async function salvarVendasMes(lancamentos: LancamentoInput[]): Promise<void> {
  const supabase = await createClient();
  const { data: rest } = await supabase.from("restaurantes").select("id").limit(1).maybeSingle();
  if (!rest) throw new Error("Restaurante não encontrado");

  const rows = lancamentos.map((l) => ({
    restaurante_id: rest.id,
    receita_id: l.receita_id,
    canal_id: l.canal_id,
    mes: l.mes,
    quantidade: Math.max(0, Math.round(l.quantidade)),
    preco_unitario: l.preco_unitario,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("vendas_mes")
    .upsert(rows, { onConflict: "restaurante_id,receita_id,canal_id,mes" });

  if (error) throw new Error("Erro ao salvar lançamentos");
  revalidatePath("/gestao");
}

export async function getVendasMes(mes: string): Promise<VendaMes[]> {
  const supabase = await createClient();
  const { data: rest } = await supabase.from("restaurantes").select("id").limit(1).maybeSingle();
  if (!rest) return [];

  const { data } = await supabase
    .from("vendas_mes")
    .select("*")
    .eq("restaurante_id", rest.id)
    .eq("mes", mes);

  return (data ?? []) as VendaMes[];
}

export async function getVendasRange(meses: string[]): Promise<VendaMes[]> {
  const supabase = await createClient();
  const { data: rest } = await supabase.from("restaurantes").select("id").limit(1).maybeSingle();
  if (!rest) return [];

  const { data } = await supabase
    .from("vendas_mes")
    .select("*")
    .eq("restaurante_id", rest.id)
    .in("mes", meses);

  return (data ?? []) as VendaMes[];
}
