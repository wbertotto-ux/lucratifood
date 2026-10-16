import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const adminEmail = process.env.ADMIN_EMAIL ?? "";
  if (!session?.user?.email || session.user.email !== adminEmail) {
    return new Response("Forbidden", { status: 403 });
  }

  const adminSupabase = createAdminClient();

  const [
    { data: usersData },
    { data: restaurantes },
    { data: assinaturas },
  ] = await Promise.all([
    adminSupabase.auth.admin.listUsers({ perPage: 1000 }),
    adminSupabase.from("restaurantes").select("id, dono_id, nome, nome_dono, cidade, estado"),
    adminSupabase.from("assinaturas").select("restaurante_id, plano_id, status, vigencia_ate"),
  ]);

  const restauranteMap = new Map((restaurantes ?? []).map((r) => [r.dono_id, r]));
  const assinaturaMap = new Map((assinaturas ?? []).map((a) => [a.restaurante_id, a]));

  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const fmtDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString("pt-BR") : "";

  const header = [
    "nome_dono", "email", "restaurante", "cidade", "estado",
    "plano", "status", "vigencia_ate", "cadastro_em", "ultimo_acesso",
  ];

  const rows = (usersData?.users ?? []).map((u) => {
    const rest = restauranteMap.get(u.id);
    const assin = rest ? assinaturaMap.get(rest.id) : null;
    return [
      rest?.nome_dono ?? "",
      u.email ?? "",
      rest?.nome ?? "",
      rest?.cidade ?? "",
      rest?.estado ?? "",
      assin?.plano_id ?? "",
      assin?.status ?? "",
      fmtDate(assin?.vigencia_ate),
      fmtDate(u.created_at),
      fmtDate(u.last_sign_in_at),
    ].map(escape).join(",");
  });

  const csv = [header.join(","), ...rows].join("\n");
  const hoje = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="lucratifood-usuarios-${hoje}.csv"`,
    },
  });
}
