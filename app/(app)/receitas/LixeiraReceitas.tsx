"use client";

import { useState } from "react";
import { Trash2, RotateCcw, ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { restaurarReceita, excluirReceitaPermanentemente } from "@/lib/actions/receitas";

type ReceitaArquivada = { id: string; nome: string; tipo: string };

interface Props {
  receitas: ReceitaArquivada[];
}

export function LixeiraReceitas({ receitas }: Props) {
  const [aberta, setAberta] = useState(false);
  const [restaurando, setRestaurando] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState<string | null>(null);

  if (receitas.length === 0) return null;

  async function handleRestaurar(id: string) {
    setRestaurando(id);
    await restaurarReceita(id);
    setRestaurando(null);
  }

  async function handleExcluir(id: string, nome: string) {
    if (!confirm(`Excluir "${nome}" permanentemente? Esta ação não pode ser desfeita.`)) return;
    setExcluindo(id);
    await excluirReceitaPermanentemente(id);
    setExcluindo(null);
  }

  return (
    <div className="mt-6">
      <button
        onClick={() => setAberta((v) => !v)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Lixeira ({receitas.length} {receitas.length === 1 ? "receita" : "receitas"})
        {aberta ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {aberta && (
        <div className="mt-3 rounded-md border border-dashed border-muted-foreground/30 divide-y divide-border">
          {receitas.map((r) => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="flex-1 text-sm text-muted-foreground line-through">{r.nome}</span>
              <Badge variant="outline" className="text-xs">
                {r.tipo === "prato" ? "Prato" : "Sub-receita"}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-xs"
                disabled={restaurando === r.id || excluindo === r.id}
                onClick={() => handleRestaurar(r.id)}
              >
                <RotateCcw className="w-3 h-3" />
                {restaurando === r.id ? "Restaurando…" : "Restaurar"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                disabled={restaurando === r.id || excluindo === r.id}
                onClick={() => handleExcluir(r.id, r.nome)}
              >
                <X className="w-3 h-3" />
                {excluindo === r.id ? "Excluindo…" : "Excluir"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
