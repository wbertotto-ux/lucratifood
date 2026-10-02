"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { criarInsumo, atualizarInsumo } from "@/lib/actions/insumos";

const schema = z.object({
  nome: z.string().min(1, "Obrigatório"),
  categoria_id: z.string().optional(),
  unidade_compra: z.string().min(1, "Obrigatório"),
  qtd_por_embalagem: z.coerce.number().positive("Deve ser positivo"),
  unidade_base: z.enum(["g", "ml", "un"]),
  preco_pago: z.coerce.number().nonnegative("Não pode ser negativo"),
  fornecedor: z.string().optional(),
  fator_correcao: z.coerce.number().positive().default(1),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

type InsumoEdit = FormData & { id: string; preco_pago: number };

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  insumo: InsumoEdit | null;
  categorias: { id: string; nome: string }[];
  restauranteId: string;
}

function normalizarErroInsumo(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.startsWith("LIMITE_PLANO:insumos:")) {
    const limite = msg.split(":")[2];
    return `Limite do plano atingido: o plano Essencial permite até ${limite} insumos.`;
  }
  return "Erro ao salvar. Tente novamente.";
}

export function InsumoFormDialog({ open, onOpenChange, insumo, categorias }: Props) {
  const [salvando, setSalvando] = useState(false);
  const [erroServidor, setErroServidor] = useState<string | null>(null);
  const [pesoComprado, setPesoComprado] = useState("");
  const [pesoAproveitado, setPesoAproveitado] = useState("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { fator_correcao: 1, unidade_base: "g" },
  });

  const unidadeBase = watch("unidade_base");
  const precoPago = watch("preco_pago");
  const qtdPorEmbalagem = watch("qtd_por_embalagem");

  const custoUnitario = precoPago && qtdPorEmbalagem && qtdPorEmbalagem > 0
    ? (precoPago / qtdPorEmbalagem).toFixed(4)
    : null;

  useEffect(() => {
    if (insumo) {
      reset(insumo as FormData);
    } else {
      reset({ fator_correcao: 1, unidade_base: "g" });
    }
  }, [insumo, reset]);

  function calcularFatorCorrecao() {
    const comprado = parseFloat(pesoComprado);
    const aproveitado = parseFloat(pesoAproveitado);
    if (comprado > 0 && aproveitado > 0 && aproveitado <= comprado) {
      setValue("fator_correcao", parseFloat((comprado / aproveitado).toFixed(4)));
    }
  }

  async function onSubmit(data: FormData) {
    setSalvando(true);
    setErroServidor(null);
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => v !== undefined && fd.append(k, String(v)));
    try {
      if (insumo) {
        await atualizarInsumo(insumo.id, fd);
      } else {
        await criarInsumo(fd);
      }
      onOpenChange(false);
    } catch (err) {
      setErroServidor(normalizarErroInsumo(err));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{insumo ? "Editar insumo" : "Novo insumo"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
          <div className="space-y-1">
            <Label>Nome *</Label>
            <Input {...register("nome")} placeholder="Ex: Mussarela" />
            {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Categoria</Label>
            <Select
              value={watch("categoria_id") ?? "none"}
              onValueChange={(v) => setValue("categoria_id", v === "none" ? undefined : (v ?? undefined))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem categoria</SelectItem>
                {Array.from(new Map(categorias.filter(c => c.nome?.trim()).map(c => [c.nome.trim().toLowerCase(), c])).values()).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />
          <p className="text-sm font-medium text-muted-foreground">Como você compra</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Unidade de compra *</Label>
              <Input {...register("unidade_compra")} placeholder="Ex: saco, caixa, kg" />
              {errors.unidade_compra && <p className="text-sm text-destructive">{errors.unidade_compra.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Unidade base *</Label>
              <Select
                value={unidadeBase}
                onValueChange={(v) => v && setValue("unidade_base", v as "g" | "ml" | "un")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="g">Grama (g)</SelectItem>
                  <SelectItem value="ml">Mililitro (ml)</SelectItem>
                  <SelectItem value="un">Unidade (un)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Quanto vem na embalagem ({unidadeBase}) *</Label>
              <Input {...register("qtd_por_embalagem")} type="number" step="0.001" placeholder="Ex: 5000" />
              {errors.qtd_por_embalagem && <p className="text-sm text-destructive">{errors.qtd_por_embalagem.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Preço pago (R$) *</Label>
              <Input {...register("preco_pago")} type="number" step="0.01" placeholder="Ex: 18,90" />
              {errors.preco_pago && <p className="text-sm text-destructive">{errors.preco_pago.message}</p>}
            </div>
          </div>

          {custoUnitario && (
            <p className="text-xs text-muted-foreground bg-muted rounded p-2">
              Custo por {unidadeBase}: <strong>R$ {custoUnitario}</strong>
            </p>
          )}

          <Separator />
          <p className="text-sm font-medium text-muted-foreground">Fator de correção (perda na limpeza)</p>

          <div className="grid grid-cols-3 gap-2 items-end">
            <div className="space-y-1">
              <Label>Peso comprado ({unidadeBase})</Label>
              <Input value={pesoComprado} onChange={(e) => setPesoComprado(e.target.value)} type="number" step="any" />
            </div>
            <div className="space-y-1">
              <Label>Peso aproveitado ({unidadeBase})</Label>
              <Input value={pesoAproveitado} onChange={(e) => setPesoAproveitado(e.target.value)} type="number" step="any" />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={calcularFatorCorrecao}>
              Calcular
            </Button>
          </div>

          <div className="space-y-1">
            <Label>Fator de correção</Label>
            <Input {...register("fator_correcao")} type="number" step="0.0001" />
            <p className="text-xs text-muted-foreground">1,00 = sem perda · 1,25 = 25% de perda</p>
          </div>

          <Separator />

          <div className="space-y-1">
            <Label>Fornecedor (opcional)</Label>
            <Input {...register("fornecedor")} placeholder="Ex: Laticínios Silva" />
          </div>

          <div className="space-y-1">
            <Label>Observações (opcional)</Label>
            <Textarea {...register("observacoes")} rows={2} />
          </div>

          {erroServidor && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{erroServidor}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando}>
              {salvando ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
