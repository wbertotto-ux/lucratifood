"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { MailCheck } from "lucide-react";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setCarregando(true);
    setErro(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });

    setCarregando(false);
    if (error) {
      setErro("Não foi possível enviar o e-mail. Tente novamente.");
      return;
    }
    setEnviado(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Logo size="md" href="/" />
          <p className="mt-3 text-muted-foreground text-sm font-medium">Recuperar acesso</p>
        </div>

        <Card className="shadow-sm border-border">
          <CardContent className="pt-6">
            {enviado ? (
              <div className="text-center py-4 space-y-3">
                <MailCheck className="w-10 h-10 text-primary mx-auto" />
                <p className="font-semibold text-foreground">E-mail enviado!</p>
                <p className="text-sm text-muted-foreground">
                  Verifique sua caixa de entrada em <strong>{email}</strong> e clique no link para redefinir sua senha.
                </p>
                <p className="text-xs text-muted-foreground">
                  Não recebeu? Verifique o spam ou{" "}
                  <button
                    onClick={() => setEnviado(false)}
                    className="text-primary underline"
                  >
                    tente novamente
                  </button>
                  .
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Digite seu e-mail e enviaremos um link para você criar uma nova senha.
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                {erro && (
                  <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{erro}</p>
                )}
                <Button type="submit" className="w-full font-semibold" size="lg" disabled={carregando}>
                  {carregando ? "Enviando…" : "Enviar link de recuperação"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-5">
          Lembrou a senha?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
