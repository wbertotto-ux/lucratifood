"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { atualizarRestaurante } from "@/lib/actions/configuracoes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CreditCard, User, Store, Check, ArrowUpRight,
  ShieldCheck, AlertTriangle, KeyRound,
} from "lucide-react";

type Restaurante = {
  id: string; nome: string;
  pct_impostos: number; pct_taxa_cartao: number; pct_margem_minima: number;
};

type Assinatura = {
  id: string; status: string; vigencia_ate: string | null; created_at: string;
  planos: {
    id: string; nome: string; preco_mensal: number;
    max_receitas: number | null; max_insumos: number | null; max_canais: number | null;
  } | null;
} | null;

interface Props {
  email: string;
  restaurante: Restaurante | null;
  assinatura: Assinatura;
}

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  ativo:     { label: "Ativo",     variant: "default" },
  pendente:  { label: "Pendente",  variant: "secondary" },
  suspenso:  { label: "Suspenso",  variant: "destructive" },
  cancelado: { label: "Cancelado", variant: "destructive" },
};

function formatarData(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function formatarMoeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ContaClient({ email, restaurante, assinatura }: Props) {
  const router = useRouter();
  const plano = assinatura?.planos;
  const statusInfo = STATUS_LABELS[assinatura?.status ?? ""] ?? { label: assinatura?.status ?? "—", variant: "secondary" as const };
  const isPro = plano?.id === "pro";

  // --- Aba Perfil ---
  const [senhaAtual, setSenhaAtual] = useState("");
  const [senhaNova, setSenhaNova] = useState("");
  const [senhaConfirmar, setSenhaConfirmar] = useState("");
  const [senhaErro, setSenhaErro] = useState<string | null>(null);
  const [senhaOk, setSenhaOk] = useState(false);
  const [senhaCarregando, setSenhaCarregando] = useState(false);

  async function alterarSenha(e: React.FormEvent) {
    e.preventDefault();
    setSenhaErro(null);
    setSenhaOk(false);
    if (senhaNova.length < 6) { setSenhaErro("Mínimo 6 caracteres."); return; }
    if (senhaNova !== senhaConfirmar) { setSenhaErro("As senhas não conferem."); return; }
    setSenhaCarregando(true);
    const supabase = createClient();
    // Reautenticar com a senha atual antes de trocar
    const { error: reAuthError } = await supabase.auth.signInWithPassword({ email, password: senhaAtual });
    if (reAuthError) { setSenhaErro("Senha atual incorreta."); setSenhaCarregando(false); return; }
    const { error } = await supabase.auth.updateUser({ password: senhaNova });
    setSenhaCarregando(false);
    if (error) { setSenhaErro("Não foi possível alterar a senha."); return; }
    setSenhaOk(true);
    setSenhaAtual(""); setSenhaNova(""); setSenhaConfirmar("");
  }

  // --- Aba Restaurante ---
  const [nomeRest, setNomeRest] = useState(restaurante?.nome ?? "");
  const [impostos, setImpostos] = useState(((restaurante?.pct_impostos ?? 0) * 100).toFixed(1));
  const [taxaCartao, setTaxaCartao] = useState(((restaurante?.pct_taxa_cartao ?? 0) * 100).toFixed(1));
  const [margem, setMargem] = useState(((restaurante?.pct_margem_minima ?? 0) * 100).toFixed(1));
  const [restSalvo, setRestSalvo] = useState(false);
  const [restCarregando, setRestCarregando] = useState(false);

  async function salvarRestaurante(e: React.FormEvent) {
    e.preventDefault();
    setRestSalvo(false);
    setRestCarregando(true);
    const fd = new FormData();
    fd.set("nome", nomeRest);
    fd.set("pct_impostos", impostos);
    fd.set("pct_taxa_cartao", taxaCartao);
    fd.set("pct_margem_minima", margem);
    await atualizarRestaurante(fd);
    setRestCarregando(false);
    setRestSalvo(true);
    router.refresh();
    setTimeout(() => setRestSalvo(false), 3000);
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Minha conta</h1>

      <Tabs defaultValue="plano">
        <TabsList className="mb-6">
          <TabsTrigger value="plano" className="gap-2">
            <CreditCard className="w-4 h-4" /> Plano
          </TabsTrigger>
          <TabsTrigger value="perfil" className="gap-2">
            <User className="w-4 h-4" /> Perfil
          </TabsTrigger>
          <TabsTrigger value="restaurante" className="gap-2">
            <Store className="w-4 h-4" /> Restaurante
          </TabsTrigger>
        </TabsList>

        {/* ── ABA PLANO ── */}
        <TabsContent value="plano" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Assinatura atual</CardTitle>
                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {plano ? (
                <>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-extrabold text-foreground">{plano.nome}</span>
                    <span className="text-muted-foreground mb-0.5">{formatarMoeda(plano.preco_mensal)}/mês</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Fichas técnicas", value: plano.max_receitas != null ? `até ${plano.max_receitas}` : "Ilimitadas" },
                      { label: "Insumos",          value: plano.max_insumos   != null ? `até ${plano.max_insumos}`   : "Ilimitados" },
                      { label: "Canais de venda",  value: plano.max_canais    != null ? `até ${plano.max_canais}`    : "Ilimitados" },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-lg bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground mb-1">{label}</p>
                        <p className="text-sm font-semibold text-foreground">{value}</p>
                      </div>
                    ))}
                  </div>

                  {assinatura?.vigencia_ate && (
                    <p className="text-sm text-muted-foreground">
                      Próxima cobrança: <span className="font-medium text-foreground">{formatarData(assinatura.vigencia_ate)}</span>
                    </p>
                  )}

                  <p className="text-sm text-muted-foreground">
                    Assinante desde {formatarData(assinatura?.created_at ?? null)}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">Nenhuma assinatura encontrada.</p>
              )}
            </CardContent>
          </Card>

          {/* Upgrade / Mudar plano */}
          {!isPro && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-foreground mb-1">Faça upgrade para o PRO</p>
                  <p className="text-sm text-muted-foreground">
                    Fichas ilimitadas, multicanal, gráficos e alertas automáticos.
                  </p>
                </div>
                <Button asChild className="shrink-0 gap-1.5">
                  <Link href="/planos">
                    Ver planos <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {isPro && (
            <Card>
              <CardContent className="pt-5 flex items-center gap-3 text-sm text-muted-foreground">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                Você está no plano PRO. Para cancelar ou alterar a assinatura, entre em contato pelo WhatsApp.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── ABA PERFIL ── */}
        <TabsContent value="perfil" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Dados de acesso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>E-mail</Label>
                <Input value={email} disabled className="bg-muted/50" />
                <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado por aqui.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <KeyRound className="w-4 h-4" /> Alterar senha
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={alterarSenha} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="senha-atual">Senha atual</Label>
                  <Input
                    id="senha-atual"
                    type="password"
                    placeholder="••••••••"
                    value={senhaAtual}
                    onChange={(e) => setSenhaAtual(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="senha-nova">Nova senha</Label>
                  <Input
                    id="senha-nova"
                    type="password"
                    placeholder="••••••••"
                    value={senhaNova}
                    onChange={(e) => setSenhaNova(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="senha-confirmar">Confirmar nova senha</Label>
                  <Input
                    id="senha-confirmar"
                    type="password"
                    placeholder="••••••••"
                    value={senhaConfirmar}
                    onChange={(e) => setSenhaConfirmar(e.target.value)}
                    required
                  />
                </div>
                {senhaErro && (
                  <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> {senhaErro}
                  </div>
                )}
                {senhaOk && (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
                    <Check className="w-4 h-4 shrink-0" /> Senha alterada com sucesso.
                  </div>
                )}
                <Button type="submit" disabled={senhaCarregando} className="w-full">
                  {senhaCarregando ? "Salvando…" : "Salvar nova senha"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ABA RESTAURANTE ── */}
        <TabsContent value="restaurante">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Informações do restaurante</CardTitle>
            </CardHeader>
            <CardContent>
              {restaurante ? (
                <form onSubmit={salvarRestaurante} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="nome-rest">Nome do restaurante</Label>
                    <Input
                      id="nome-rest"
                      value={nomeRest}
                      onChange={(e) => setNomeRest(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="impostos">Impostos (%)</Label>
                      <Input
                        id="impostos"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={impostos}
                        onChange={(e) => setImpostos(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cartao">Taxa cartão (%)</Label>
                      <Input
                        id="cartao"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={taxaCartao}
                        onChange={(e) => setTaxaCartao(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="margem">Margem mínima (%)</Label>
                      <Input
                        id="margem"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={margem}
                        onChange={(e) => setMargem(e.target.value)}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Para canais de venda, categorias e custos operacionais, acesse{" "}
                    <Link href="/configuracoes" className="text-primary hover:underline">Configurações</Link>.
                  </p>

                  {restSalvo && (
                    <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
                      <Check className="w-4 h-4 shrink-0" /> Informações salvas.
                    </div>
                  )}

                  <Button type="submit" disabled={restCarregando} className="w-full">
                    {restCarregando ? "Salvando…" : "Salvar"}
                  </Button>
                </form>
              ) : (
                <p className="text-muted-foreground text-sm">Nenhum restaurante configurado.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
