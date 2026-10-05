"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, BookOpen, Settings, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/insumos", label: "Insumos", icon: Package },
  { href: "/receitas", label: "Receitas", icon: BookOpen },
  { href: "/configuracoes", label: "Config", icon: Settings },
  { href: "/conta", label: "Conta", icon: UserCircle },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 md:hidden z-50 bg-background border-t h-16 flex items-center">
      {nav.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-0.5 py-2",
            pathname.startsWith(href) ? "text-primary" : "text-muted-foreground"
          )}
        >
          <Icon className="w-5 h-5" />
          <span className="text-[10px] font-medium">{label}</span>
        </Link>
      ))}
    </nav>
  );
}
