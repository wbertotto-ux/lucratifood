import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const WEBHOOK_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN ?? "";

export async function POST(req: NextRequest) {
  const token = req.headers.get("asaas-access-token") ?? "";
  if (!WEBHOOK_TOKEN || token !== WEBHOOK_TOKEN) {
    console.log(`[webhook] Unauthorized — token mismatch or empty (configured: ${!!WEBHOOK_TOKEN})`);
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

  console.log(`[webhook] event=${body.event} subscriptionId=${subscriptionId} serviceKeySet=${!!process.env.SUPABASE_SERVICE_ROLE_KEY}`);

  if (!subscriptionId) {
    return NextResponse.json({ ok: true });
  }

  const supabase = createAdminClient();

  if (body.event === "PAYMENT_CONFIRMED" || body.event === "PAYMENT_RECEIVED") {
    const { data, error, count } = await supabase
      .from("assinaturas")
      .update({ status: "ativo", vigencia_ate: null })
      .eq("asaas_subscription_id", subscriptionId)
      .select();
    console.log(`[webhook] PAYMENT update result: rows=${data?.length ?? 0} error=${error?.message ?? "none"} count=${count}`);
  } else if (body.event === "PAYMENT_OVERDUE") {
    const { data, error } = await supabase
      .from("assinaturas")
      .update({ status: "suspenso" })
      .eq("asaas_subscription_id", subscriptionId)
      .select();
    console.log(`[webhook] OVERDUE update result: rows=${data?.length ?? 0} error=${error?.message ?? "none"}`);
  } else if (body.event === "SUBSCRIPTION_DELETED" || body.event === "SUBSCRIPTION_INACTIVATED") {
    const { data, error } = await supabase
      .from("assinaturas")
      .update({ status: "cancelado" })
      .eq("asaas_subscription_id", subscriptionId)
      .select();
    console.log(`[webhook] DELETE update result: rows=${data?.length ?? 0} error=${error?.message ?? "none"}`);
  } else {
    console.log(`[webhook] unhandled event: ${body.event}`);
  }

  return NextResponse.json({ ok: true });
}
