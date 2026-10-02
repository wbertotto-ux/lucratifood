"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import {
  atualizarRestaurante, criarCanal, atualizarCanal, criarCategoria, excluirCategoria,
  criarCustoOperacional, atualizarCustoOperacional, excluirCustoOperacional, atualizarPorcoesMes,
} from "@/lib/actions/configuracoes";
import { formatarMoeda } from "@/lib/formatacao";

type Restaurante = { id: string; nome: string; pct_impostos: number; pct_taxa_cartao: number; pct_margem_minima: number; porcoes_mes_estimado?: number };
type Canal = { id: string; nome: string; pct_comissao: number; ativo: boolean };
type Categoria = { id: string; nome: string };
type CustoOp = { id: string; categoria: string; descricao: string; valor_mensal: number; ativo: boolean };

interface Props {
  restaurante: Restaurante;
  canais: Canal[];
  categorias: Categoria[];
  custosOperacionais: CustoOp[];
}

const CATEGORIAS_CUSTO = [
  { value: "energia", label: "Energia Elétrica" },
  { value: "gas", label: "Gás" },
  { value: "funcionarios", label: "Funcionários" },
  { value: "aluguel", label: "Aluguel / Locação" },
  { value: "manutencao", label: "Manutenção" },
  { value: "marketing", label: "Marketing" },
  { value: "contabilidade", label: "Contabilidade" },
  { value: "outros", label: "Outros" },
];

const labelCategoria = (val: string) => CATEGORIAS_CUSTO.find(c => c.value === val)?.label ?? val;

export function ConfiguracoesClient({ restaurante, canais, categorias, custosOperacionais }: Props) {
  const [salvandoRest, setSalvandoRest] = useState(false);
  const [novaCategoria, setNovaCategoria] = useState("");
  const [novoCanal, setNovoCanal] = useState({ nome: "", pct_comissao: "" });
  const [erroCanal, setErroCanal] = useState<string | null>(null);

  // Custos operacionais state
  const [novoCusto, setNovoCusto] = useState({ categoria: "energia", descricao: "", valor_mensal: "" });
  const [editandoCusto, setEditandoCusto] = useState<string | null>(null);
  const [editCusto, setEditCusto] = useState({ descricao: "", valor_mensal: "" });
  const [porcoesMes, setPorcoesMes] = useState(String(restaurante.porcoes_mes_estimado ?? 300));
  const [salvandoPorcoes, setSalvandoPorcoes] = useState(false);

  const totalMensal = custosOperacionais.filter(c => c.ativo).reduce((s, c) => s + Number(c.valor_mensal), 0);
  const porcoesMesNum = parseInt(porcoesMes) || 1;
  const custoOpPorPorcao = porcoesMesNum > 0 ? totalMensal / porcoesMesNum : 0;

  async function handleRestaurante(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSalvandoRest(true);
    await atualizarRestaurante(new FormData(e.currentTarget));
    setSalvandoRest(false);
  }

  async function handleNovoCanal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErroCanal(null);
    try {
      await criarCanal(new FormData(e.currentTarget));
      setNovoCanal({ nome: "", pct_comissao: "" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.startsWith("LIMITE_PLANO:canais:")) {
        const limite = msg.split(":")[2];
        setErroCanal(`Limite do plano atingido: o plano Essencial permite ${limite} canal de venda ativo.`);
      } else {
        setErroCanal("Erro ao criar canal. Tente novamente.");
      }
    }
  }

  async function handleNovaCategoria() {
    if (!novaCategoria.trim()) return;
    await criarCategoria(novaCategoria.trim());
    setNovaCategoria("");
  }

  async function handleNovoCusto(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("categoria", novoCusto.categoria);
    await criarCustoOperacional(fd);
    setNovoCusto({ categoria: "energia", descricao: "", valor_mensal: "" });
  }

  async function handleSalvarCusto(id: string) {
    const fd = new FormData();
    fd.set("descricao", editCusto.descricao);
    fd.set("valor_mensal", editCusto.valor_mensal);
    await atualizarCustoOperacional(id, fd);
    setEditandoCusto(null);
  }

  async function handleSalvarPorcoes() {
    setSalvandoPorcoes(true);
    await atualizarPorcoesMes(porcoesMesNum);
    setSalvandoPorcoes(false);
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold">Configurações</h1>

      {/* Dados do restaurante */}
      <Card>
        <CardHeader><CardTitle>Dados do restaurante</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleRestaurante} className="space-y-4">
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input name="nome" defaultValue={restaurante.nome} required />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Impostos (%)</Label>
                <Input name="pct_impostos" type="number" step="0.1" defaultValue={(restaurante.pct_impostos * 100).toFixed(1)} required />
              </div>
              <div className="space-y-1">
                <Label>Taxa de cartão (%)</Label>
                <Input name="pct_taxa_cartao" type="number" step="0.1" defaultValue={(restaurante.pct_taxa_cartao * 100).toFixed(1)} required />
              </div>
              <div className="space-y-1">
                <Label>Margem mínima (%)</Label>
                <Input name="pct_margem_minima" type="number" step="1" defaultValue={(restaurante.pct_margem_minima * 100).toFixed(0)} required />
              </div>
            </div>
            <Button type="submit" disabled={salvandoRest}>
              {salvandoRest ? "Salvando…" : "Salvar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Custos Operacionais */}
      <Card>
        <CardHeader>
          <CardTitle>Custos Operacionais</CardTitle>
          <CardDescription>
            Registre os gastos mensais fixos e variáveis da operação. O sistema distribui automaticamente o custo por porção produzida.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Lista de custos */}
          <div className="space-y-2">
            {custosOperacionais.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum custo operacional registrado.</p>
            )}
            {custosOperacionais.map((custo) => (
              <div key={custo.id} className="flex items-center gap-3 bg-muted/40 rounded-md px-3 py-2">
                <Badge variant="outline" className="text-xs shrink-0">{labelCategoria(custo.categoria)}</Badge>
                {editandoCusto === custo.id ? (
                  <>
                    <Input
                      className="flex-1 h-7 text-sm"
                      value={editCusto.descricao}
                      onChange={(e) => setEditCusto(p => ({ ...p, descricao: e.target.value }))}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      className="w-28 h-7 text-sm"
                      value={editCusto.valor_mensal}
                      onChange={(e) => setEditCusto(p => ({ ...p, valor_mensal: e.target.value }))}
                    />
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleSalvarCusto(custo.id)}>
                      <Check className="w-3.5 h-3.5 text-green-600" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditandoCusto(null)}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm">{custo.descricao}</span>
                    <span className="text-sm font-medium tabular-nums">{formatarMoeda(custo.valor_mensal)}/mês</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                      setEditandoCusto(custo.id);
                      setEditCusto({ descricao: custo.descricao, valor_mensal: String(custo.valor_mensal) });
                    }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => excluirCustoOperacional(custo.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Formulário novo custo */}
          <form onSubmit={handleNovoCusto} className="flex gap-2 flex-wrap">
            <Select value={novoCusto.categoria} onValueChange={(v) => setNovoCusto(p => ({ ...p, categoria: v ?? "" }))}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS_CUSTO.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              name="descricao"
              placeholder="Descrição (ex: Energia elétrica)"
              value={novoCusto.descricao}
              onChange={(e) => setNovoCusto(p => ({ ...p, descricao: e.target.value }))}
              className="flex-1 min-w-40"
              required
            />
            <Input
              name="valor_mensal"
              type="number"
              step="0.01"
              placeholder="R$/mês"
              value={novoCusto.valor_mensal}
              onChange={(e) => setNovoCusto(p => ({ ...p, valor_mensal: e.target.value }))}
              className="w-28"
              required
            />
            <Button type="submit" size="sm">
              <Plus className="w-4 h-4 mr-1" /> Adicionar
            </Button>
          </form>

          <Separator />

          {/* Volume de produção + resumo */}
          <div className="space-y-3">
            <div className="flex items-end gap-3">
              <div className="space-y-1 flex-1">
                <Label>Porções produzidas por mês</Label>
                <p className="text-xs text-muted-foreground">Estimativa do total de pratos que o restaurante produz mensalmente</p>
                <Input
                  type="number"
                  min="1"
                  value={porcoesMes}
                  onChange={(e) => setPorcoesMes(e.target.value)}
                  className="max-w-36"
                />
              </div>
              <Button variant="outline" size="sm" disabled={salvandoPorcoes} onClick={handleSalvarPorcoes}>
                {salvandoPorcoes ? "Salvando…" : "Salvar"}
              </Button>
            </div>

            {totalMensal > 0 && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total de custos operacionais/mês</span>
                  <span className="font-semibold">{formatarMoeda(totalMensal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Porções estimadas/mês</span>
                  <span className="font-semibold">{porcoesMesNum.toLocaleString("pt-BR")}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm font-semibold">Custo operacional por porção</span>
                  <span className="text-lg font-bold text-primary">{formatarMoeda(custoOpPorPorcao)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Este valor é somado ao custo de ingredientes de cada prato para calcular o preço sugerido.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Canais de venda */}
      <Card>
        <CardHeader><CardTitle>Canais de venda</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {canais.map((canal) => (
            <div key={canal.id} className="flex items-center gap-3">
              <span className="flex-1 text-sm font-medium">{canal.nome}</span>
              <span className="text-sm text-muted-foreground">{(canal.pct_comissao * 100).toFixed(1)}%</span>
              <Badge variant={canal.ativo ? "secondary" : "outline"}>{canal.ativo ? "Ativo" : "Inativo"}</Badge>
              <form action={async (fd) => { fd.set("ativo", String(!canal.ativo)); await atualizarCanal(canal.id, fd); }}>
                <input type="hidden" name="nome" value={canal.nome} />
                <input type="hidden" name="pct_comissao" value={(canal.pct_comissao * 100).toFixed(1)} />
                <Button type="submit" variant="ghost" size="sm">
                  {canal.ativo ? "Desativar" : "Ativar"}
                </Button>
              </form>
            </div>
          ))}
          <Separator />
          <form onSubmit={handleNovoCanal} className="flex gap-3">
            <Input
              name="nome"
              placeholder="Nome do canal"
              value={novoCanal.nome}
              onChange={(e) => setNovoCanal((p) => ({ ...p, nome: e.target.value }))}
              className="flex-1"
              required
            />
            <Input
              name="pct_comissao"
              type="number"
              step="0.1"
              placeholder="Comissão (%)"
              value={novoCanal.pct_comissao}
              onChange={(e) => setNovoCanal((p) => ({ ...p, pct_comissao: e.target.value }))}
              className="w-32"
              required
            />
            <Button type="submit" size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </form>
          {erroCanal && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{erroCanal}</p>
          )}
        </CardContent>
      </Card>

      {/* Categorias de insumo */}
      <Card>
        <CardHeader><CardTitle>Categorias de insumo</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {categorias.map((cat) => (
              <div key={cat.id} className="flex items-center gap-1">
                <Badge variant="secondary">{cat.nome}</Badge>
                <button
                  type="button"
                  onClick={() => excluirCategoria(cat.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Nova categoria…"
              value={novaCategoria}
              onChange={(e) => setNovaCategoria(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNovaCategoria()}
            />
            <Button type="button" size="sm" onClick={handleNovaCategoria}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
