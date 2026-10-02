import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const WEBHOOK_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN ?? "";

export async function POST(req: NextRequest) {
  // Valida token — rejeita se token não configurado (nunca deve estar vazio em prod)
  const token = req.headers.get("asaas-access-token") ?? "";
  if (!WEBHOOK_TOKEN || token !== WEBHOOK_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    event: string;
    payment?: { subscription?: string };
    subscription?: { id?: string };
  };

  const subscriptionId =
    body.payment?.subscription ??
    body.subscription?.id;

  if (!subscriptionId) {
    return NextResponse.json({ ok: true });
  }

  // Admin client bypassa RLS — necessário pois o webhook não tem sessão de usuário
  const supabase = createAdminClient();

  if (body.event === "PAYMENT_CONFIRMED" || body.event === "PAYMENT_RECEIVED") {
    await supabase
      .from("assinaturas")
      .update({ status: "ativo", vigencia_ate: null })
      .eq("asaas_subscription_id", subscriptionId);
  } else if (body.event === "PAYMENT_OVERDUE") {
    await supabase
      .from("assinaturas")
      .update({ status: "suspenso" })
      .eq("asaas_subscription_id", subscriptionId);
  } else if (body.event === "SUBSCRIPTION_DELETED" || body.event === "SUBSCRIPTION_INACTIVATED") {
    await supabase
      .from("assinaturas")
      .update({ status: "cancelado" })
      .eq("asaas_subscription_id", subscriptionId);
  }

  return NextResponse.json({ ok: true });
}
