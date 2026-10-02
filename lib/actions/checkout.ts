"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { criarCliente, criarAssinatura } from "@/lib/asaas";

const PRECOS: Record<string, number> = {
  essencial: 89.90,
  pro: 179.90,
};

export async function iniciarCheckout(formData: FormData) {
  const planoId = formData.get("plano") as string;
  if (!planoId || !PRECOS[planoId]) redirect("/planos");

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: restaurante } = await supabase
    .from("restaurantes")
    .select("id, nome")
    .limit(1)
    .maybeSingle();
  if (!restaurante) redirect("/onboarding");

  // Verifica se já tem assinatura ativa (evita duplicata)
  const { data: existente } = await supabase
    .from("assinaturas")
    .select("id, status")
    .eq("restaurante_id", restaurante.id)
    .eq("status", "ativo")
    .maybeSingle();

  if (existente) redirect("/dashboard");

  // Cria customer e subscription no Asaas
  let customer: { id: string };
  let subscription: { id: string; invoiceUrl: string };
  const cpfCnpj = (formData.get("cpf_cnpj") as string | null)?.replace(/\D/g, "") || undefined;

  try {
    customer = await criarCliente(restaurante.nome, session.user.email ?? "", cpfCnpj);
    subscription = await criarAssinatura(customer.id, PRECOS[planoId]);
  } catch (e) {
    console.error("[checkout] Asaas error:", e instanceof Error ? e.message : e);
    redirect(`/checkout?plano=${planoId}&erro=pagamento`);
  }

  // Salva a assinatura pendente no banco
  await supabase.from("assinaturas").insert({
    restaurante_id: restaurante.id,
    plano_id: planoId,
    status: "pendente",
    asaas_customer_id: customer!.id,
    asaas_subscription_id: subscription!.id,
  });

  // Redireciona para a página de pagamento do Asaas
  redirect(subscription!.invoiceUrl);
}
