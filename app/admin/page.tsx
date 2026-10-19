import { createAdminClient } from "@/lib/supabase/admin";
import { AdminTable } from "./AdminTable";

export const dynamic = "force-dynamic";

export type UsuarioAdmin = {
  id: string;
  email: string;
  cadastro_em: string;
  ultimo_acesso: string | null;
  restaurante_id: string | null;
  restaurante: string | null;
  nome_dono: string | null;
  cidade: string | null;
  estado: string | null;
  plano: string | null;
  status: string | null;
  vigencia_ate: string | null;
};

export default async function AdminPage() {
  const supabase = createAdminClient();

  const [
    { data: usersData, error: usersError },
    { data: restaurantes },
    { data: assinaturas },
  ] = await Promise.all([
    supabase.auth.admin.listUsers({ perPage: 1000 }),
    supabase.from("restaurantes").select("id, dono_id, nome, nome_dono, cidade, estado"),
    supabase.from("assinaturas").select("restaurante_id, plano_id, status, vigencia_ate"),
  ]);

  if (usersError) throw usersError;

  const restauranteMap = new Map((restaurantes ?? []).map((r) => [r.dono_id, r]));
  const assinaturaMap = new Map((assinaturas ?? []).map((a) => [a.restaurante_id, a]));

  const usuarios: UsuarioAdmin[] = usersData.users.map((u) => {
    const rest = restauranteMap.get(u.id);
    const assin = rest ? assinaturaMap.get(rest.id) : null;
    return {
      id: u.id,
      email: u.email ?? "",
      cadastro_em: u.created_at,
      ultimo_acesso: u.last_sign_in_at ?? null,
      restaurante_id: rest?.id ?? null,
      restaurante: rest?.nome ?? null,
      nome_dono: rest?.nome_dono ?? null,
      cidade: rest?.cidade ?? null,
      estado: rest?.estado ?? null,
      plano: assin?.plano_id ?? null,
      status: assin?.status ?? null,
      vigencia_ate: assin?.vigencia_ate ?? null,
    };
  });

  return <AdminTable usuarios={usuarios} />;
}
