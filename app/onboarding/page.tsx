import { criarRestaurante } from "@/lib/actions/onboarding";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ plano?: string }> }) {
  const { plano } = await searchParams;
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Configure seu restaurante</CardTitle>
          <CardDescription>
            Estas informações definem como os custos e margens são calculados.
            Você pode alterar depois em Configurações.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={criarRestaurante} className="space-y-6">
            <input type="hidden" name="plano" value={plano ?? "essencial"} />
            <div className="space-y-1">
              <Label htmlFor="nome">Nome do restaurante</Label>
              <Input id="nome" name="nome" placeholder="Ex: Cantina da Família" required />
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Percentuais sobre o preço de venda</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="pct_impostos">Impostos (%)</Label>
                  <Input
                    id="pct_impostos"
                    name="pct_impostos"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    defaultValue="6"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pct_taxa_cartao">Taxa de cartão (%)</Label>
                  <Input
                    id="pct_taxa_cartao"
                    name="pct_taxa_cartao"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    defaultValue="3"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pct_margem_minima">Margem mínima (%)</Label>
                  <Input
                    id="pct_margem_minima"
                    name="pct_margem_minima"
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    defaultValue="55"
                    required
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Canais de venda padrão (Salão, iFood, WhatsApp) serão criados automaticamente.
              </p>
            </div>

            <Button type="submit" className="w-full">
              Começar a usar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
