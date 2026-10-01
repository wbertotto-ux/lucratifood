"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { criarInsumo } from "@/lib/actions/insumos";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  categorias: { id: string; nome: string }[];
  restauranteId: string;
}

const MODELO_CSV = "nome,categoria,unidade_compra,qtd_por_embalagem,unidade_base,preco_pago,fornecedor,fator_correcao\nMussarela,Laticínios,kg,1000,g,32.90,Laticínios Silva,1.0\n";

type Linha = {
  linha: number;
  dados: Record<string, string>;
  erro: string | null;
};

function validarLinha(dados: Record<string, string>, idx: number): Linha {
  const obrigatorios = ["nome", "unidade_compra", "qtd_por_embalagem", "unidade_base", "preco_pago"];
  const faltando = obrigatorios.filter((k) => !dados[k]?.trim());
  if (faltando.length > 0) {
    return { linha: idx + 2, dados, erro: `Campos obrigatórios ausentes: ${faltando.join(", ")}` };
  }
  if (!["g", "ml", "un"].includes(dados.unidade_base)) {
    return { linha: idx + 2, dados, erro: `unidade_base deve ser g, ml ou un` };
  }
  if (isNaN(parseFloat(dados.qtd_por_embalagem)) || parseFloat(dados.qtd_por_embalagem) <= 0) {
    return { linha: idx + 2, dados, erro: "qtd_por_embalagem deve ser um número positivo" };
  }
  if (isNaN(parseFloat(dados.preco_pago)) || parseFloat(dados.preco_pago) < 0) {
    return { linha: idx + 2, dados, erro: "preco_pago deve ser um número não negativo" };
  }
  return { linha: idx + 2, dados, erro: null };
}

export function ImportacaoDialog({ open, onOpenChange, categorias, restauranteId }: Props) {
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function baixarModelo() {
    const blob = new Blob([MODELO_CSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo_insumos.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const parsed = (result.data as Record<string, string>[]).map((row, i) =>
          validarLinha(row, i)
        );
        setLinhas(parsed);
        setResultado(null);
      },
    });
  }

  async function importar() {
    const validas = linhas.filter((l) => !l.erro);
    if (validas.length === 0) return;
    setImportando(true);
    let ok = 0;
    for (const linha of validas) {
      const fd = new FormData();
      const cat = categorias.find((c) => c.nome.toLowerCase() === linha.dados.categoria?.toLowerCase());
      Object.entries(linha.dados).forEach(([k, v]) => {
        if (k !== "categoria") fd.append(k, v);
      });
      if (cat) fd.append("categoria_id", cat.id);
      fd.append("restaurante_id", restauranteId);
      try {
        await criarInsumo(fd);
        ok++;
      } catch { /* ignora duplicados */ }
    }
    setImportando(false);
    setResultado(`${ok} de ${validas.length} insumos importados com sucesso.`);
  }

  const erros = linhas.filter((l) => l.erro);
  const validas = linhas.filter((l) => !l.erro);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar insumos por CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={baixarModelo}>
              Baixar modelo CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              Selecionar arquivo
            </Button>
            <input ref={fileRef} type="file" accept=".csv,.xlsx" className="hidden" onChange={handleFile} />
          </div>

          {resultado && (
            <Alert>
              <AlertDescription>{resultado}</AlertDescription>
            </Alert>
          )}

          {linhas.length > 0 && (
            <>
              <div className="flex gap-3 text-sm">
                <Badge variant="secondary">{validas.length} válidos</Badge>
                {erros.length > 0 && <Badge variant="destructive">{erros.length} com erro</Badge>}
              </div>

              {erros.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-destructive">Erros encontrados:</p>
                  {erros.map((e) => (
                    <p key={e.linha} className="text-xs text-destructive">
                      Linha {e.linha}: {e.erro}
                    </p>
                  ))}
                </div>
              )}

              <div className="rounded-md border max-h-48 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {linhas.slice(0, 20).map((l) => (
                      <TableRow key={l.linha}>
                        <TableCell className="text-sm">{l.dados.nome}</TableCell>
                        <TableCell className="text-sm">{l.dados.categoria}</TableCell>
                        <TableCell className="text-sm">{l.dados.preco_pago}</TableCell>
                        <TableCell>
                          {l.erro
                            ? <Badge variant="destructive">Erro</Badge>
                            : <Badge variant="secondary">OK</Badge>
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <Button onClick={importar} disabled={importando || validas.length === 0}>
                  {importando ? "Importando…" : `Importar ${validas.length} insumos`}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
