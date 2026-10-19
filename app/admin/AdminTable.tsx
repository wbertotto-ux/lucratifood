"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import type { UsuarioAdmin } from "./page";

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

function StatusBadge({ status }: { status: string | null }) {
  if (status === "ativo")
    return <Badge className="bg-green-100 text-green-800 border-0 hover:bg-green-100">Ativo</Badge>;
  if (status === "pendente")
    return <Badge variant="outline" className="text-yellow-700 border-yellow-400">Pendente</Badge>;
  if (status === "cancelado")
    return <Badge variant="outline" className="text-red-600 border-red-400">Cancelado</Badge>;
  if (status === "suspenso")
    return <Badge variant="outline" className="text-orange-600 border-orange-400">Suspenso</Badge>;
  return <Badge variant="outline" className="text-muted-foreground">Sem plano</Badge>;
}

type FiltroStatus = "todos" | "ativos" | "inativos";
type FiltroPlano = "todos" | "essencial" | "pro";

export function AdminTable({ usuarios }: { usuarios: UsuarioAdmin[] }) {
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos");
  const [filtroPlano, setFiltroPlano] = useState<FiltroPlano>("todos");

  const filtrados = useMemo(() => {
    return usuarios.filter((u) => {
      const q = busca.toLowerCase();
      const matchBusca =
        !busca ||
        u.email.toLowerCase().includes(q) ||
        (u.restaurante ?? "").toLowerCase().includes(q) ||
        (u.nome_dono ?? "").toLowerCase().includes(q);

      const matchStatus =
        filtroStatus === "todos" ? true :
        filtroStatus === "ativos" ? u.status === "ativo" :
        u.status !== "ativo";

      const matchPlano =
        filtroPlano === "todos" ? true :
        filtroPlano === "pro" ? u.plano === "pro" :
        u.plano === "essencial" || !u.plano;

      return matchBusca && matchStatus && matchPlano;
    });
  }, [usuarios, busca, filtroStatus, filtroPlano]);

  const ativos = usuarios.filter((u) => u.status === "ativo").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">Usuários</h1>
          <p className="text-sm text-muted-foreground">
            {usuarios.length} cadastros · {ativos} ativos
          </p>
        </div>
        <a href="/admin/export">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
        </a>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <Input
          placeholder="Buscar por e-mail, nome ou restaurante…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="max-w-xs h-8 text-sm"
        />
        <div className="flex rounded-md border overflow-hidden text-xs">
          {(["todos", "ativos", "inativos"] as FiltroStatus[]).map((s) => (
            <button
              key={s}
              className={`px-3 py-1.5 capitalize transition-colors ${
                filtroStatus === s ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
              }`}
              onClick={() => setFiltroStatus(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex rounded-md border overflow-hidden text-xs">
          {([["todos", "Todos"], ["essencial", "Essencial"], ["pro", "PRO"]] as [FiltroPlano, string][]).map(([val, label]) => (
            <button
              key={val}
              className={`px-3 py-1.5 transition-colors ${
                filtroPlano === val ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
              }`}
              onClick={() => setFiltroPlano(val)}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground ml-auto">{filtrados.length} resultado(s)</span>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Nome</th>
              <th className="text-left px-3 py-2 font-medium whitespace-nowrap">E-mail</th>
              <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Negócio</th>
              <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Cidade / UF</th>
              <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Plano</th>
              <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Status</th>
              <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Vigência</th>
              <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Cadastro</th>
              <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Último acesso</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((u) => (
              <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-3 py-2 whitespace-nowrap">{u.nome_dono ?? "—"}</td>
                <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{u.email}</td>
                <td className="px-3 py-2 whitespace-nowrap">{u.restaurante ?? "—"}</td>
                <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                  {u.cidade && u.estado
                    ? `${u.cidade} / ${u.estado}`
                    : (u.cidade ?? u.estado ?? "—")}
                </td>
                <td className="px-3 py-2 uppercase text-xs font-medium">{u.plano ?? "—"}</td>
                <td className="px-3 py-2"><StatusBadge status={u.status} /></td>
                <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{formatDate(u.vigencia_ate)}</td>
                <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{formatDate(u.cadastro_em)}</td>
                <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{formatDate(u.ultimo_acesso)}</td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-10 text-center text-muted-foreground">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
