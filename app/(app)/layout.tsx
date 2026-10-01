import { Sidebar } from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getAssinaturaAtiva } from "@/lib/assinaturas";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: restaurante } = await supabase.from("restaurantes").select("id").limit(1).maybeSingle();
  if (!restaurante) redirect("/onboarding");

  const assinatura = await getAssinaturaAtiva(restaurante.id);
  if (!assinatura) redirect("/planos?pendente=1");

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
