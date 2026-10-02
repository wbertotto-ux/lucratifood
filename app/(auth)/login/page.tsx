"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/Logo";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(6, "Mínimo 6 caracteres"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const erroUrl = searchParams.get("erro");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setCarregando(true);
    setErro(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.senha,
    });
    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setErro("Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.");
      } else if (error.message.toLowerCase().includes("invalid login credentials")) {
        setErro("E-mail ou senha incorretos.");
      } else {
        setErro(`Erro: ${error.message}`);
      }
      setCarregando(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Logo size="md" href="/" />
          <p className="mt-3 text-muted-foreground text-sm font-medium">Entre na sua conta</p>
        </div>

        <Card className="shadow-sm border-border">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" autoComplete="email" placeholder="seu@email.com" {...register("email")} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="senha">Senha</Label>
                  <Link
                    href="/esqueci-senha"
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Esqueci minha senha
                  </Link>
                </div>
                <Input id="senha" type="password" autoComplete="current-password" placeholder="••••••••" {...register("senha")} />
                {errors.senha && <p className="text-xs text-destructive">{errors.senha.message}</p>}
              </div>
              {erroUrl === "link_invalido" && !erro && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                  O link expirou ou é inválido. Solicite um novo link de recuperação de senha.
                </p>
              )}
              {erro && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{erro}</p>}
              <Button type="submit" className="w-full font-semibold" size="lg" disabled={carregando}>
                {carregando ? "Entrando…" : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-5">
          Não tem conta?{" "}
          <Link href="/cadastro" className="font-semibold text-primary hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
