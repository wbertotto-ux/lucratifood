"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, BookOpen, Settings, LogOut, AlertTriangle, UserCircle, LifeBuoy } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

const nav = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/insumos", label: "Insumos", icon: Package },
  { href: "/receitas", label: "Receitas", icon: BookOpen },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
  { href: "/conta", label: "Minha conta", icon: UserCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function sair() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col border-r bg-background h-screen sticky top-0">
      <div className="flex items-center px-4 py-4 border-b">
        <Logo size="sm" href="/dashboard" />
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
              pathname.startsWith(href)
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-2 border-t">
        <a href="mailto:contato@lucratifood.com.br">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-3 text-muted-foreground">
            <LifeBuoy className="w-4 h-4" />
            Suporte
          </Button>
        </a>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-3 text-muted-foreground" onClick={sair}>
          <LogOut className="w-4 h-4" />
          Sair
        </Button>
      </div>
    </aside>
  );
}
