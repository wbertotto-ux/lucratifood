import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-background h-14 flex items-center px-6 gap-4">
        <Logo size="sm" href="/admin" />
        <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
          Admin
        </span>
        <div className="flex-1" />
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Voltar ao app
        </Link>
      </header>
      <main className="max-w-7xl mx-auto p-6">{children}</main>
    </div>
  );
}
