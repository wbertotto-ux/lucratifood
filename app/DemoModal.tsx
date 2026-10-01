"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, CalendarCheck } from "lucide-react";

const PORTES = [
  { value: "ate5", label: "Até 5" },
  { value: "5a10", label: "5 a 10" },
  { value: "10a15", label: "10 a 15" },
  { value: "20a25", label: "20 a 25" },
  { value: "mais30", label: "Mais de 30" },
];

const CALENDAR_URL = process.env.NEXT_PUBLIC_DEMO_CALENDAR_URL ?? "#";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function DemoModal({ open, onOpenChange }: Props) {
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    empresa: "",
    whatsapp: "",
    porte: "",
    instagram: "",
  });

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function calendarLink() {
    const params = new URLSearchParams({ name: form.nome });
    if (form.whatsapp) params.set("a1", form.whatsapp);
    return `${CALENDAR_URL}?${params.toString()}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // TODO: persist lead via server action or webhook
    setEnviado(true);
    setLoading(false);
  }

  function handleClose(v: boolean) {
    onOpenChange(v);
    if (!v) setTimeout(() => setEnviado(false), 300);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md rounded-2xl border-2 border-border p-8">
        {!enviado ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold">Solicitar demonstração</DialogTitle>
              <DialogDescription>
                Preencha os dados abaixo e agende um horário com nosso consultor para uma demonstração completa e valores.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    placeholder="Seu nome"
                    required
                    value={form.nome}
                    onChange={(e) => set("nome", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="empresa">Restaurante / Empresa</Label>
                  <Input
                    id="empresa"
                    placeholder="Nome do negócio"
                    required
                    value={form.empresa}
                    onChange={(e) => set("empresa", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    placeholder="(11) 99999-9999"
                    required
                    value={form.whatsapp}
                    onChange={(e) => set("whatsapp", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    placeholder="@seurestaurante"
                    required
                    value={form.instagram}
                    onChange={(e) => set("instagram", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Quantos funcionários?</Label>
                <div className="flex flex-wrap gap-2">
                  {PORTES.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => set("porte", p.value)}
                      className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                        form.porte === p.value
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:border-primary hover:text-foreground"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full gap-2 mt-2"
                disabled={loading || !form.porte}
              >
                {loading ? "Enviando…" : "Avançar para agendamento"}
                <ArrowRight className="w-4 h-4" />
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Ao enviar, você concorda com nossa{" "}
                <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                  Política de Privacidade
                </a>
                . Seus dados são tratados conforme a LGPD.
              </p>
            </form>
          </>
        ) : (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <CalendarCheck className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-foreground mb-1">Tudo certo, {form.nome.split(" ")[0]}!</h3>
              <p className="text-sm text-muted-foreground">
                Agora escolha um horário na agenda. Já chegarei sabendo do {form.empresa}.
              </p>
            </div>
            <a
              href={calendarLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Escolher horário na agenda
              <ArrowRight className="w-4 h-4" />
            </a>
            <p className="text-xs text-muted-foreground">
              Entraremos em contato pelo WhatsApp {form.whatsapp} caso precise reagendar.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
