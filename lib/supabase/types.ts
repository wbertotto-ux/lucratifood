export type UnidadeBase = "g" | "kg" | "ml" | "l" | "un";
export type TipoReceita = "prato" | "lanche" | "petisco" | "sub_receita";

export interface Database {
  public: {
    Tables: {
      restaurantes: {
        Row: {
          id: string;
          dono_id: string;
          nome: string;
          pct_impostos: number;
          pct_taxa_cartao: number;
          pct_margem_minima: number;
          created_at: string;
        };
        Insert: {
          dono_id: string;
          nome: string;
          pct_impostos: number;
          pct_taxa_cartao: number;
          pct_margem_minima: number;
        };
        Update: {
          nome?: string;
          pct_impostos?: number;
          pct_taxa_cartao?: number;
          pct_margem_minima?: number;
        };
      };
      canais_venda: {
        Row: {
          id: string;
          restaurante_id: string;
          nome: string;
          pct_comissao: number;
          ativo: boolean;
        };
        Insert: {
          restaurante_id: string;
          nome: string;
          pct_comissao: number;
          ativo?: boolean;
        };
        Update: {
          nome?: string;
          pct_comissao?: number;
          ativo?: boolean;
        };
      };
      categorias_insumo: {
        Row: {
          id: string;
          restaurante_id: string;
          nome: string;
        };
        Insert: {
          restaurante_id: string;
          nome: string;
        };
        Update: {
          nome?: string;
        };
      };
      insumos: {
        Row: {
          id: string;
          restaurante_id: string;
          nome: string;
          categoria_id: string | null;
          unidade_compra: string;
          qtd_por_embalagem: number;
          unidade_base: UnidadeBase;
          preco_pago: number;
          fornecedor: string | null;
          fator_correcao: number;
          observacoes: string | null;
          arquivado: boolean;
          atualizado_em: string;
        };
        Insert: {
          restaurante_id: string;
          nome: string;
          categoria_id?: string | null;
          unidade_compra: string;
          qtd_por_embalagem: number;
          unidade_base: UnidadeBase;
          preco_pago: number;
          fornecedor?: string | null;
          fator_correcao?: number;
          observacoes?: string | null;
          arquivado?: boolean;
        };
        Update: {
          nome?: string;
          categoria_id?: string | null;
          unidade_compra?: string;
          qtd_por_embalagem?: number;
          unidade_base?: UnidadeBase;
          preco_pago?: number;
          fornecedor?: string | null;
          fator_correcao?: number;
          observacoes?: string | null;
          arquivado?: boolean;
        };
      };
      historico_precos: {
        Row: {
          id: string;
          insumo_id: string;
          preco: number;
          registrado_em: string;
        };
        Insert: {
          insumo_id: string;
          preco: number;
        };
        Update: Record<string, never>;
      };
      receitas: {
        Row: {
          id: string;
          restaurante_id: string;
          nome: string;
          tipo: TipoReceita;
          rendimento: number;
          unidade_rendimento: string;
          modo_preparo: string | null;
          foto_url: string | null;
          arquivado: boolean;
        };
        Insert: {
          restaurante_id: string;
          nome: string;
          tipo: TipoReceita;
          rendimento: number;
          unidade_rendimento: string;
          modo_preparo?: string | null;
          foto_url?: string | null;
          arquivado?: boolean;
        };
        Update: {
          nome?: string;
          rendimento?: number;
          unidade_rendimento?: string;
          modo_preparo?: string | null;
          foto_url?: string | null;
          arquivado?: boolean;
        };
      };
      itens_receita: {
        Row: {
          id: string;
          receita_id: string;
          insumo_id: string | null;
          sub_receita_id: string | null;
          qtd_liquida: number;
          unidade: string;
        };
        Insert: {
          receita_id: string;
          insumo_id?: string | null;
          sub_receita_id?: string | null;
          qtd_liquida: number;
          unidade: string;
        };
        Update: {
          qtd_liquida?: number;
          unidade?: string;
        };
      };
      precos_canal: {
        Row: {
          id: string;
          receita_id: string;
          canal_id: string;
          preco_venda: number;
          embalagem_insumo_id: string | null;
        };
        Insert: {
          receita_id: string;
          canal_id: string;
          preco_venda: number;
          embalagem_insumo_id?: string | null;
        };
        Update: {
          preco_venda?: number;
          embalagem_insumo_id?: string | null;
        };
      };
    };
  };
}
