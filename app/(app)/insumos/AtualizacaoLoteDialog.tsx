"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { atualizarPrecosEmLote } from "@/lib/actions/insumos";
import { formatarMoeda } from "@/lib/formatacao";

interface Insumo { id: string; nome: string; preco_pago: number }

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  insumos: Insumo[];
  onConcluido: () => void;
}

export function AtualizacaoLoteDialog({ open, onOpenChange, insumos, onConcluido }: Props) {
  const [precos, setPrecos] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  function setPreco(id: string, valor: string) {
    setPrecos((prev) => ({ ...prev, [id]: valor }));
  }

  async function salvar() {
    setSalvando(true);
    const updates = insumos
      .filter((i) => precos[i.id] && parseFloat(precos[i.id]) >= 0)
      .map((i) => ({ id: i.id, preco_pago: parseFloat(precos[i.id]) }));
    if (updates.length > 0) await atualizarPrecosEmLote(updates);
    setSalvando(false);
    onOpenChange(false);
    onConcluido();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Atualizar preços em lote</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {insumos.map((insumo) => (
            <div key={insumo.id} className="flex items-center gap-3">
              <span className="flex-1 text-sm">{insumo.nome}</span>
              <span className="text-xs text-muted-foreground w-20">{formatarMoeda(insumo.preco_pago)}</span>
              <Input
                type="number"
                step="0.01"
                placeholder="Novo preço"
                className="w-28"
                value={precos[insumo.id] ?? ""}
                onChange={(e) => setPreco(insumo.id, e.target.value)}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando…" : "Atualizar preços"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
