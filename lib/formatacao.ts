export function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatarPct(valor: number): string {
  return (valor * 100).toFixed(1) + "%";
}
