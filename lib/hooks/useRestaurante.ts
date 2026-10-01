"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type Restaurante = Database["public"]["Tables"]["restaurantes"]["Row"];

export function useRestaurante() {
  const [restaurante, setRestaurante] = useState<Restaurante | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("restaurantes")
      .select("*")
      .single()
      .then(({ data }) => {
        setRestaurante(data);
        setCarregando(false);
      });
  }, []);

  return { restaurante, carregando };
}
