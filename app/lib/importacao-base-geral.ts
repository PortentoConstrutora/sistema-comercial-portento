import { supabase } from "./supabase";
import { escolherGestorParaLead } from "./distribuicao";

type LeadBaseGeral = {
  id_lead: string;
  data_entrada?: string | null;
  nome: string;
  telefone?: string | null;
  empreendimento?: string | null;
  origem?: string | null;
  campanha?: string | null;
  etapa_funil?: string | null;
  proxima_acao?: string | null;
  prioridade?: string | null;
  planilha_origem?: string | null;
};

export async function importarLeadDaBaseGeral(lead: LeadBaseGeral) {
  const { data: leadExistente, error: erroBusca } = await supabase
    .from("crm_leads")
    .select("id, id_lead")
    .eq("id_lead", lead.id_lead)
    .maybeSingle();

  if (erroBusca) {
    throw new Error("Erro ao verificar duplicidade do lead.");
  }

  if (leadExistente) {
    return {
      ok: false,
      motivo: "duplicado",
      mensagem: "Lead já existe no CRM.",
    };
  }

  const gestorEscolhido = await escolherGestorParaLead();

  const { data: leadCriado, error: erroCriacaoLead } = await supabase
    .from("crm_leads")
    .insert({
      id_lead: lead.id_lead,
      data_entrada: lead.data_entrada || new Date().toISOString(),
      nome: lead.nome,
      telefone: lead.telefone || "",
      empreendimento: lead.empreendimento || "",
      origem: lead.origem || "",
      campanha: lead.campanha || "",
      gestor: gestorEscolhido.usuario,
      status_lead: "Novo",
      etapa_funil: lead.etapa_funil || "Lead Novo",
      proxima_acao: lead.proxima_acao || "Primeiro contato",
      observacoes: `Importado da Base Geral${lead.planilha_origem ? ` - ${lead.planilha_origem}` : ""}`,
      ultima_atualizacao: new Date().toISOString(),
    })
    .select()
    .single();

  if (erroCriacaoLead || !leadCriado) {
    throw new Error("Erro ao criar lead importado.");
  }

  const prazoHoje = new Date();
  prazoHoje.setHours(18, 0, 0, 0);

  const { data: tarefaCriada, error: erroTarefa } = await supabase
    .from("crm_tarefas")
    .insert({
      lead_id: leadCriado.id,
      tipo: "Primeiro contato",
      status: "Pendente",
      prazo: prazoHoje.toISOString(),
      observacao: `Tarefa automática criada na importação do lead ${leadCriado.nome}.`,
      gestor: gestorEscolhido.usuario,
      atualizado_em: new Date().toISOString(),
    })
    .select()
    .single();

  if (erroTarefa) {
    throw new Error("Lead importado, mas deu erro ao criar tarefa.");
  }

  await supabase.from("crm_historico").insert({
    lead_id: leadCriado.id,
    tarefa_id: tarefaCriada?.id ?? null,
    usuario: "sistema_importacao",
    tipo_evento: "lead_importado_base_geral",
    descricao: `Lead "${leadCriado.nome}" importado da Base Geral e distribuído para ${gestorEscolhido.nome}.`,
  });

  await supabase.from("crm_distribuicao_log").insert({
    lead_id: leadCriado.id,
    id_lead: leadCriado.id_lead,
    gestor: gestorEscolhido.usuario,
    regra_aplicada: "roleta_base_geral",
    observacao: `Lead importado da Base Geral e distribuído automaticamente para ${gestorEscolhido.nome}.`,
  });

  await supabase
    .from("crm_gestores")
    .update({
      quantidade_recebida_mes: gestorEscolhido.quantidade_recebida_mes + 1,
      quantidade_recebida_dia: gestorEscolhido.quantidade_recebida_dia + 1,
      ultimo_lead_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", gestorEscolhido.id);

  return {
    ok: true,
    motivo: "importado",
    mensagem: `Lead importado com sucesso para ${gestorEscolhido.nome}.`,
  };
}