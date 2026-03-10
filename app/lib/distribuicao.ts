import { supabase } from "./supabase";

type Gestor = {
  id: number;
  usuario: string;
  nome: string;
  ativo: boolean;
  disponivel: boolean;
  quantidade_recebida_mes: number;
  quantidade_recebida_dia: number;
  ultimo_lead_em: string | null;
};

export async function escolherGestorParaLead() {
  const { data, error } = await supabase
    .from("crm_gestores")
    .select("*")
    .eq("ativo", true)
    .eq("disponivel", true)
    .order("quantidade_recebida_mes", { ascending: true })
    .order("quantidade_recebida_dia", { ascending: true })
    .order("ultimo_lead_em", { ascending: true, nullsFirst: true });

  if (error) {
    console.error(error);
    throw new Error("Erro ao buscar gestores para distribuição.");
  }

  if (!data || data.length === 0) {
    throw new Error("Nenhum gestor ativo e disponível para receber leads.");
  }

  const gestorEscolhido = data[0] as Gestor;

  return gestorEscolhido;
}