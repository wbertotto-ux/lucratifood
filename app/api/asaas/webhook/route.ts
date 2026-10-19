import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const WEBHOOK_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN ?? "";

function tokenValido(recebido: string) {
  if (!WEBHOOK_TOKEN) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(WEBHOOK_TOKEN);
  return a.length === b.length && timingSafeEqual(a, b);
}

const STATUS_POR_EVENTO: Record<string, { status: string; extra?: Record<string, unknown> }> = {
  PAYMENT_CONFIRMED: { status: "ativo", extra: { vigencia_ate: null } },
  PAYMENT_RECEIVED: { status: "ativo", extra: { vigencia_ate: null } },
  PAYMENT_OVERDUE: { status: "suspenso" },
  SUBSCRIPTION_DELETED: { status: "cancelado" },
  SUBSCRIPTION_INACTIVATED: { status: "cancelado" },
};

export async function POST(req: NextRequest) {
  if (!tokenValido(req.headers.get("asaas-access-token") ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { event?: string; payment?: { subscription?: string }; subscription?: { id?: string } };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const subscriptionId = body.payment?.subscription ?? body.subscription?.id;
  const acao = body.event ? STATUS_POR_EVENTO[body.event] : undefined;

  if (!subscriptionId || !acao) {
    return NextResponse.json({ ok: true });
  }

  const { data, error } = await createAdminClient()
    .from("assinaturas")
    .update({ status: acao.status, ...acao.extra })
    .eq("asaas_subscription_id", subscriptionId)
    .select("id");

  // 500 faz o Asaas reenviar o evento; um pagamento nunca deve ser perdido em silêncio.
  if (error) {
    console.error(`[webhook] falha ao atualizar ${body.event} sub=${subscriptionId}: ${error.message}`);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
  if (!data?.length) {
    console.error(`[webhook] assinatura não encontrada: ${body.event} sub=${subscriptionId}`);
  }

  return NextResponse.json({ ok: true });
}
