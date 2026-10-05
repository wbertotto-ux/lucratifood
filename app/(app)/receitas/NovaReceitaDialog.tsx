"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { criarReceita } from "@/lib/actions/receitas";

type TipoPrincipal = "prato" | "lanche" | "petisco" | "sub_receita";

const UNIDADES_POR_TIPO: Record<TipoPrincipal, { default: string; options: { value: string; label: string }[] }> = {
  prato:       { default: "porções",  options: [{ value: "porções", label: "Porções" }, { value: "unidades", label: "Unidades" }, { value: "g", label: "Gramas (g)" }, { value: "kg", label: "Quilogramas (kg)" }, { value: "ml", label: "Mililitros (ml)" }, { value: "L", label: "Litros (L)" }] },
  lanche:      { default: "unidades", options: [{ value: "unidades", label: "Unidades" }, { value: "porções", label: "Porções" }] },
  petisco:     { default: "unidades", options: [{ value: "unidades", label: "Unidades" }, { value: "porções", label: "Porções" }, { value: "g", label: "Gramas (g)" }] },
  sub_receita: { default: "ml",       options: [{ value: "ml", label: "Mililitros (ml)" }, { value: "g", label: "Gramas (g)" }, { value: "L", label: "Litros (L)" }, { value: "kg", label: "Quilogramas (kg)" }, { value: "unidades", label: "Unidades" }] },
};

function normalizarErroReceita(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.startsWith("LIMITE_PLANO:receitas:")) {
    const limite = msg.split(":")[2];
    return `Limite do plano atingido: o plano Essencial permite até ${limite} fichas técnicas.`;
  }
  return "Erro ao criar receita. Tente novamente.";
}

export function NovaReceitaDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [tipo, setTipo] = useState<TipoPrincipal>("prato");
  const [unidade, setUnidade] = useState(UNIDADES_POR_TIPO["prato"].default);

  function handleTipo(v: TipoPrincipal) {
    setTipo(v);
    setUnidade(UNIDADES_POR_TIPO[v].default);
  }

  const placeholderNome: Record<TipoPrincipal, string> = {
    prato: "Ex: Frango grelhado",
    lanche: "Ex: X-Burguer",
    petisco: "Ex: Bolinho de bacalhau",
    sub_receita: "Ex: Molho de tomate",
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    const fd = new FormData(e.currentTarget);
    fd.set("tipo", tipo);
    fd.set("unidade_rendimento", unidade);
    try {
      const id = await criarReceita(fd);
      setOpen(false);
      router.push(`/receitas/${id}`);
    } catch (err) {
      setErro(normalizarErroReceita(err));
    } finally {
      setSalvando(false);
    }
  }

  const unidadeConfig = UNIDADES_POR_TIPO[tipo];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm"><Plus className="w-4 h-4 mr-1" />Nova receita</Button>} />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova receita</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={(v) => v && handleTipo(v as TipoPrincipal)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prato">Prato</SelectItem>
                <SelectItem value="lanche">Lanche</SelectItem>
                <SelectItem value="petisco">Petisco</SelectItem>
                <SelectItem value="sub_receita">Sub-receita</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Nome *</Label>
            <Input name="nome" required placeholder={placeholderNome[tipo]} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Rendimento *</Label>
              <Input name="rendimento" type="number" step="0.01" min="0.01" required placeholder="Ex: 2" />
            </div>
            <div className="space-y-1">
              <Label>Unidade *</Label>
              <Select value={unidade} onValueChange={(v) => v && setUnidade(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {unidadeConfig.options.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {erro && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{erro}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={salvando}>
              {salvando ? "Criando…" : "Criar receita"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
