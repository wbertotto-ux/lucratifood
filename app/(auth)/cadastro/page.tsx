"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  confirmar: z.string(),
}).refine((d) => d.senha === d.confirmar, {
  message: "Senhas não conferem",
  path: ["confirmar"],
});

type FormData = z.infer<typeof schema>;

export default function CadastroPage() {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const plano = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("plano") ?? "essencial" : "essencial";

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setCarregando(true);
    setErro(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.senha,
    });
    if (error) {
      setErro(error.message);
      setCarregando(false);
      return;
    }
    router.push(`/onboarding?plano=${plano}`);
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Logo size="md" href="/" />
          <p className="mt-3 text-muted-foreground text-sm font-medium">Crie sua conta</p>
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
                <Label htmlFor="senha">Senha</Label>
                <Input id="senha" type="password" placeholder="••••••••" {...register("senha")} />
                {errors.senha && <p className="text-xs text-destructive">{errors.senha.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmar">Confirmar senha</Label>
                <Input id="confirmar" type="password" placeholder="••••••••" {...register("confirmar")} />
                {errors.confirmar && <p className="text-xs text-destructive">{errors.confirmar.message}</p>}
              </div>
              {erro && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{erro}</p>}
              <Button type="submit" className="w-full font-semibold" size="lg" disabled={carregando}>
                {carregando ? "Criando conta…" : "Criar conta"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="text-center text-sm text-muted-foreground mt-5">
          Já tem conta?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
