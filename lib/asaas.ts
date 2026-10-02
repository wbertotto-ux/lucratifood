const BASE_URL = process.env.ASAAS_BASE_URL ?? "https://sandbox.asaas.com/api/v3";
const API_KEY  = process.env.ASAAS_API_KEY ?? "";

async function req<T>(method: string, path: string, body?: object): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json", access_token: API_KEY },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Asaas ${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function criarCliente(nome: string, email: string, cpfCnpj?: string) {
  return req<{ id: string }>("POST", "/customers", { name: nome, email, cpfCnpj });
}

export async function criarAssinatura(customerId: string, valor: number) {
  const due = new Date();
  due.setDate(due.getDate() + 1);
  const nextDueDate = due.toISOString().split("T")[0];

  const subscription = await req<{ id: string }>("POST", "/subscriptions", {
    customer: customerId,
    billingType: "UNDEFINED",
    value: valor,
    nextDueDate,
    cycle: "MONTHLY",
    description: "Licença Lucratifood",
  });

  // A invoiceUrl fica na cobrança (payment), não na subscription
  const payments = await req<{ data: Array<{ id: string; invoiceUrl: string }> }>(
    "GET",
    `/payments?subscription=${subscription.id}&limit=1`
  );
  const invoiceUrl = payments.data[0]?.invoiceUrl ?? "";

  return { id: subscription.id, invoiceUrl };
}

export async function cancelarAssinatura(subscriptionId: string) {
  return req<unknown>("DELETE", `/subscriptions/${subscriptionId}`);
}
