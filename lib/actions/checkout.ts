"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { criarCliente, criarAssinatura, buscarInvoiceUrl } from "@/lib/asaas";

const PRECOS: Record<string, number> = {
  essencial: 89.90,
  pro: 179.90,
};

function validarCpf(cpf: string): boolean {
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
  let rem = (sum * 10) % 11;
  if (rem >= 10) rem = 0;
  if (rem !== parseInt(cpf[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
  rem = (sum * 10) % 11;
  if (rem >= 10) rem = 0;
  return rem === parseInt(cpf[10]);
}

function validarCnpj(cnpj: string): boolean {
  if (/^(\d)\1{13}$/.test(cnpj)) return false;
  const calc = (s: string, len: number) => {
    let sum = 0, pos = len - 7;
    for (let i = len; i >= 1; i--) {
      sum += parseInt(s[len - i]) * pos--;
      if (pos < 2) pos = 9;
    }
    const r = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    return r;
  };
  return calc(cnpj, 12) === parseInt(cnpj[12]) && calc(cnpj, 13) === parseInt(cnpj[13]);
}

function validarDocumento(valor: string): boolean {
  const d = valor.replace(/\D/g, "");
  if (d.length === 11) return validarCpf(d);
  if (d.length === 14) return validarCnpj(d);
  return false;
}

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

  // Evita duplicata: ativa → dashboard, pendente → redireciona para o link já criado
  const { data: existente } = await supabase
    .from("assinaturas")
    .select("id, status, asaas_subscription_id")
    .eq("restaurante_id", restaurante.id)
    .in("status", ["ativo", "pendente"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existente?.status === "ativo") redirect("/dashboard");

  if (existente?.status === "pendente" && existente.asaas_subscription_id) {
    try {
      const invoiceUrl = await buscarInvoiceUrl(existente.asaas_subscription_id);
      if (invoiceUrl) redirect(invoiceUrl);
    } catch { /* se falhar, segue para criar nova cobrança */ }
  }

  // Cria customer e subscription no Asaas
  let customer: { id: string };
  let subscription: { id: string; invoiceUrl: string };
  const cpfCnpjRaw = (formData.get("cpf_cnpj") as string | null) ?? "";
  if (!validarDocumento(cpfCnpjRaw)) redirect(`/checkout?plano=${planoId}&erro=documento`);
  const cpfCnpj = cpfCnpjRaw.replace(/\D/g, "");

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
  if (!subscription!.invoiceUrl) redirect(`/checkout?plano=${planoId}&erro=pagamento`);
  redirect(subscription!.invoiceUrl);
}
