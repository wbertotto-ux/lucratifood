"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Copy, Archive, FileDown } from "lucide-react";
import { arquivarInsumo, duplicarInsumo } from "@/lib/actions/insumos";
import { InsumoFormDialog } from "./InsumoFormDialog";
import { ImportacaoDialog } from "./ImportacaoDialog";
import { AtualizacaoLoteDialog } from "./AtualizacaoLoteDialog";
import { formatarMoeda } from "@/lib/formatacao";

type Insumo = {
  id: string;
  nome: string;
  categoria_id: string | null;
  unidade_compra: string;
  qtd_por_embalagem: number;
  unidade_base: "g" | "ml" | "un";
  preco_pago: number;
  fator_correcao: number;
  fornecedor: string | null;
  observacoes: string | null;
  arquivado: boolean;
  atualizado_em: string;
  categorias_insumo: { nome: string } | null;
};

type Categoria = { id: string; nome: string };

interface Props {
  insumosIniciais: Insumo[];
  categorias: Categoria[];
  restauranteId: string;
  maxInsumos?: number | null;
}

function custoUnitarioFormatado(insumo: Insumo) {
  const custo = insumo.preco_pago / insumo.qtd_por_embalagem;
  return `R$ ${custo.toFixed(4)}/${insumo.unidade_base}`;
}

export function InsumosClient({ insumosIniciais, categorias, restauranteId, maxInsumos }: Props) {
  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas");
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [insumoEditar, setInsumoEditar] = useState<Insumo | null>(null);
  const [importDialogAberto, setImportDialogAberto] = useState(false);
  const [loteDialogAberto, setLoteDialogAberto] = useState(false);

  const categoriasDedup = useMemo(() =>
    Array.from(new Map(categorias.filter(c => c.nome?.trim()).map(c => [c.nome.trim().toLowerCase(), c])).values()),
    [categorias]
  );

  const contagemPorCategoria = useMemo(() => {
    const map: Record<string, number> = {};
    for (const i of insumosIniciais) {
      const key = i.categoria_id ?? "__sem__";
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  }, [insumosIniciais]);

  const insumosFiltrados = useMemo(() => {
    return insumosIniciais.filter((i) => {
      const matchBusca = i.nome.toLowerCase().includes(busca.toLowerCase()) ||
        (i.fornecedor ?? "").toLowerCase().includes(busca.toLowerCase());
      const matchCategoria = categoriaFiltro === "todas" || i.categoria_id === categoriaFiltro;
      return matchBusca && matchCategoria;
    });
  }, [insumosIniciais, busca, categoriaFiltro]);

  function toggleSelecionado(id: string) {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const insumosSelecionados = insumosIniciais.filter((i) => selecionados.includes(i.id));

  function baixarExemplo() {
    const csv = [
      "nome,categoria,unidade_compra,qtd_por_embalagem,unidade_base,preco_pago,fornecedor,fator_correcao",
      "Mussarela,Laticínios,kg,1000,g,32.90,Laticínios Silva,1.0",
      "Farinha de trigo,Grãos,kg,5000,g,18.50,Atacadão,1.0",
      "Óleo de soja,Óleos,lata,900,ml,9.90,Distribuidora ABC,1.0",
      "Tomate,Hortifruti,kg,1000,g,4.50,Feira local,0.85",
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "exemplo_insumos.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Insumos</h1>
          {maxInsumos !== null && maxInsumos !== undefined && (
            <Badge variant={insumosIniciais.length >= maxInsumos ? "destructive" : "secondary"} className="text-xs">
              {insumosIniciais.length}/{maxInsumos} insumos
            </Badge>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {selecionados.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setLoteDialogAberto(true)}>
              Atualizar preços ({selecionados.length})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={baixarExemplo}>
            <FileDown className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Planilha de exemplo</span>
            <span className="sm:hidden">Planilha</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setImportDialogAberto(true)}>
            <Download className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Importar CSV</span>
            <span className="sm:hidden">CSV</span>
          </Button>
          <Button size="sm" onClick={() => { setInsumoEditar(null); setDialogAberto(true); }}>
            <Plus className="w-4 h-4 mr-1" />
            Novo insumo
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou fornecedor…"
          className="pl-8"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setCategoriaFiltro("todas")}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
            categoriaFiltro === "todas"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-muted-foreground hover:border-primary hover:text-foreground"
          }`}
        >
          Todas
          <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
            categoriaFiltro === "todas" ? "bg-white/20" : "bg-muted"
          }`}>
            {insumosIniciais.length}
          </span>
        </button>
        {categoriasDedup.map((c) => {
          const count = contagemPorCategoria[c.id] ?? 0;
          if (count === 0) return null;
          const ativa = categoriaFiltro === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setCategoriaFiltro(c.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                ativa
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-primary hover:text-foreground"
              }`}
            >
              {c.nome}
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                ativa ? "bg-white/20" : "bg-muted"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">
                <input
                  type="checkbox"
                  onChange={(e) =>
                    setSelecionados(e.target.checked ? insumosFiltrados.map((i) => i.id) : [])
                  }
                  checked={selecionados.length === insumosFiltrados.length && insumosFiltrados.length > 0}
                />
              </TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Embalagem</TableHead>
              <TableHead>Preço pago</TableHead>
              <TableHead>Custo/unidade</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {insumosFiltrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhum insumo encontrado.
                </TableCell>
              </TableRow>
            )}
            {insumosFiltrados.map((insumo) => (
              <TableRow key={insumo.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selecionados.includes(insumo.id)}
                    onChange={() => toggleSelecionado(insumo.id)}
                  />
                </TableCell>
                <TableCell className="font-medium">{insumo.nome}</TableCell>
                <TableCell>
                  {insumo.categorias_insumo ? (
                    <Badge variant="secondary">{insumo.categorias_insumo.nome}</Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {insumo.unidade_compra} · {insumo.qtd_por_embalagem} {insumo.unidade_base}
                </TableCell>
                <TableCell>{formatarMoeda(insumo.preco_pago)}</TableCell>
                <TableCell className="text-sm">{custoUnitarioFormatado(insumo)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<button className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted" />}>
                      <MoreHorizontal className="w-4 h-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setInsumoEditar(insumo); setDialogAberto(true); }}>
                        <Pencil className="w-4 h-4 mr-2" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => duplicarInsumo(insumo.id)}>
                        <Copy className="w-4 h-4 mr-2" /> Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => arquivarInsumo(insumo.id)}
                      >
                        <Archive className="w-4 h-4 mr-2" /> Arquivar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <InsumoFormDialog
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        insumo={insumoEditar ? {
          ...insumoEditar,
          categoria_id: insumoEditar.categoria_id ?? undefined,
          fornecedor: insumoEditar.fornecedor ?? undefined,
          observacoes: insumoEditar.observacoes ?? undefined,
        } : null}
        categorias={categorias}
        restauranteId={restauranteId}
      />

      <ImportacaoDialog
        open={importDialogAberto}
        onOpenChange={setImportDialogAberto}
        categorias={categorias}
        restauranteId={restauranteId}
      />

      <AtualizacaoLoteDialog
        open={loteDialogAberto}
        onOpenChange={setLoteDialogAberto}
        insumos={insumosSelecionados}
        onConcluido={() => setSelecionados([])}
      />
    </div>
  );
}
