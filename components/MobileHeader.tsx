"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, LifeBuoy, LogOut } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";

export function MobileHeader() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function sair() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <header className="fixed top-0 inset-x-0 md:hidden h-14 z-40 flex items-center justify-between px-4 bg-background border-b">
        <Logo size="sm" href="/dashboard" />
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
          <Menu className="w-5 h-5" />
          <span className="sr-only">Menu</span>
        </Button>
      </header>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-64 p-0">
          <SheetHeader className="px-4 py-4 border-b">
            <SheetTitle>Opções</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1 p-2">
            <a
              href="mailto:contato@lucratifood.com.br"
              className="flex items-center gap-3 px-3 py-3 rounded-md text-sm text-muted-foreground hover:bg-muted transition-colors"
              onClick={() => setOpen(false)}
            >
              <LifeBuoy className="w-4 h-4" />
              Suporte
            </a>
            <button
              onClick={sair}
              className="flex items-center gap-3 px-3 py-3 rounded-md text-sm text-muted-foreground hover:bg-muted transition-colors w-full text-left"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
