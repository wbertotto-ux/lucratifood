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

export function NovaReceitaDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [tipo, setTipo] = useState<"prato" | "sub_receita">("prato");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSalvando(true);
    const fd = new FormData(e.currentTarget);
    fd.set("tipo", tipo);
    try {
      const id = await criarReceita(fd);
      setOpen(false);
      router.push(`/receitas/${id}`);
    } finally {
      setSalvando(false);
    }
  }

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
            <Select value={tipo} onValueChange={(v) => v && setTipo(v as "prato" | "sub_receita")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prato">Prato</SelectItem>
                <SelectItem value="sub_receita">Sub-receita</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Nome *</Label>
            <Input name="nome" required placeholder={tipo === "prato" ? "Ex: Frango grelhado" : "Ex: Molho de tomate"} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Rendimento *</Label>
              <Input name="rendimento" type="number" step="0.01" min="0.01" required placeholder="Ex: 2" />
            </div>
            <div className="space-y-1">
              <Label>Unidade *</Label>
              <Input
                name="unidade_rendimento"
                required
                placeholder={tipo === "prato" ? "porções" : "ml"}
              />
            </div>
          </div>
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
