"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type Tarefa = {
  id: number;
  lead_id: number | null;
  tipo: string;
  status: string;
  prazo: string | null;
  observacao: string | null;
  gestor: string | null;
  criado_em: string | null;
  atualizado_em?: string | null;
  cliente_nome?: string;
  cliente_telefone?: string;
  cliente_produto?: string;
};

type LeadResumo = {
  nome: string;
  telefone: string;
  produto: string;
  gestor: string;
  imobiliaria: string;
  corretor: string;
};

const DATA_HOJE = () => new Date().toISOString().split("T")[0];

function somarDiasNaData(dataBase: Date, dias: number) {
  const novaData = new Date(dataBase);
  novaData.setDate(novaData.getDate() + dias);
  return novaData.toISOString().split("T")[0];
}

function sugerirDataPorResultado(resultado: string) {
  if (resultado === "Tentei e não consegui") return somarDiasNaData(new Date(), 1);
  if (resultado === "Cliente pediu retorno") return somarDiasNaData(new Date(), 2);
  if (resultado === "Cliente quer visita") return somarDiasNaData(new Date(), 1);
  if (resultado === "Cliente pediu proposta") return somarDiasNaData(new Date(), 1);
  return somarDiasNaData(new Date(), 1);
}

export default function TarefasCrmPage() {
  const router = useRouter();
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [perfil, setPerfil] = useState("");
  const [usuarioLogado, setUsuarioLogado] = useState("");
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState("abertas");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroPrazo, setFiltroPrazo] = useState("todos");
  const [salvandoId, setSalvandoId] = useState<number | null>(null);

  const [modalTarefaId, setModalTarefaId] = useState<number | null>(null);
  const [modalTarefaTipo, setModalTarefaTipo] = useState<string>("");
  const [modalResultado, setModalResultado] = useState("Consegui falar com o cliente");
  const [modalProximaAcao, setModalProximaAcao] = useState("Fazer retorno");
  const [modalProximaAcaoCustom, setModalProximaAcaoCustom] = useState("");
  const [modalObservacao, setModalObservacao] = useState("");
  const [modalCriarNovaTarefa, setModalCriarNovaTarefa] = useState(true);
  const [modalNovoTipoTarefa, setModalNovoTipoTarefa] = useState("Retorno");
  const [modalNovaDataTarefa, setModalNovaDataTarefa] = useState("");
  const [modalLancarNaAgenda, setModalLancarNaAgenda] = useState(false);
  const [modalDataAgenda, setModalDataAgenda] = useState("");
  const [modalHoraAgenda, setModalHoraAgenda] = useState("");
  const [modalLocalAgenda, setModalLocalAgenda] = useState("");
  const [modalRegistrarNoDiario, setModalRegistrarNoDiario] = useState(false);
  const [modalTipoAtividadeDiario, setModalTipoAtividadeDiario] = useState("Visita Cliente");
  const [modalDataDiario, setModalDataDiario] = useState(DATA_HOJE());
  const [modalHoraDiario, setModalHoraDiario] = useState("");
  const [modalImobiliariaDiario, setModalImobiliariaDiario] = useState("");
  const [modalCorretorDiario, setModalCorretorDiario] = useState("");
  const [modalCriarFechamento, setModalCriarFechamento] = useState(false);
  const [modalStatusFechamento, setModalStatusFechamento] = useState("Em andamento");

  const tarefaSelecionada = useMemo(
    () => tarefas.find((tarefa) => tarefa.id === modalTarefaId) || null,
    [tarefas, modalTarefaId],
  );

  useEffect(() => {
    const logado = localStorage.getItem("portento_logado");
    const nome = localStorage.getItem("portento_nome");
    const perfilSalvo = localStorage.getItem("portento_perfil");
    const usuario = localStorage.getItem("portento_usuario");

    if (logado !== "sim") {
      router.push("/login");
      return;
    }

    setNomeUsuario(nome || "");
    setPerfil(perfilSalvo || "");
    setUsuarioLogado((usuario || "").toLowerCase());
  }, [router]);

  async function carregarTarefas() {
    setCarregando(true);

    const { data, error } = await supabase
      .from("crm_tarefas")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error(error);
      setTarefas([]);
      setCarregando(false);
      return;
    }

    const tarefasBase = (data || []) as Tarefa[];
    const leadIds = Array.from(
      new Set(
        tarefasBase
          .map((tarefa) => tarefa.lead_id)
          .filter((leadId): leadId is number => typeof leadId === "number"),
      ),
    );

    if (leadIds.length === 0) {
      setTarefas(tarefasBase);
      setCarregando(false);
      return;
    }

    const { data: leadsData, error: leadsError } = await supabase
      .from("crm_leads")
      .select("id, nome, telefone, empreendimento")
      .in("id", leadIds);

    if (leadsError) {
      console.error(leadsError);
      setTarefas(tarefasBase);
      setCarregando(false);
      return;
    }

    const leadsMap = new Map<number, { nome?: string; telefone?: string; empreendimento?: string }>();

    (leadsData || []).forEach((lead) => {
      leadsMap.set(lead.id, lead);
    });

    const tarefasEnriquecidas = tarefasBase.map((tarefa) => {
      const lead = tarefa.lead_id ? leadsMap.get(tarefa.lead_id) : null;

      return {
        ...tarefa,
        cliente_nome: lead?.nome || "",
        cliente_telefone: lead?.telefone || "",
        cliente_produto: lead?.empreendimento || "",
      };
    });

    setTarefas(tarefasEnriquecidas);
    setCarregando(false);
  }

  useEffect(() => {
    carregarTarefas();
  }, []);

  function getStatusVisual(tarefa: Tarefa) {
    if (tarefa.status === "Concluída") return "Concluída";

    if (tarefa.status === "Pendente" && tarefa.prazo) {
      const agora = new Date();
      const prazo = new Date(tarefa.prazo);

      if (prazo < agora) return "Atrasada";
    }

    return tarefa.status;
  }

  async function carregarLeadResumo(
    leadId: number | null,
    fallbackGestor: string,
  ): Promise<LeadResumo> {
    const leadPadrao = {
      nome: leadId ? `Lead ${leadId}` : "Lead sem vínculo",
      telefone: "",
      produto: "",
      gestor: fallbackGestor,
      imobiliaria: "",
      corretor: "",
    };

    if (!leadId) return leadPadrao;

    const { data, error } = await supabase
      .from("crm_leads")
      .select("nome, telefone, empreendimento, gestor, imobiliaria, corretor")
      .eq("id", leadId)
      .single();

    if (error || !data) {
      if (error) console.error(error);
      return leadPadrao;
    }

    return {
      nome: data.nome || leadPadrao.nome,
      telefone: data.telefone || "",
      produto: data.empreendimento || "",
      gestor: data.gestor || fallbackGestor,
      imobiliaria: data.imobiliaria || "",
      corretor: data.corretor || "",
    };
  }

  function resetarModalConclusao() {
    setModalTarefaId(null);
    setModalTarefaTipo("");
    setModalResultado("Consegui falar com o cliente");
    setModalProximaAcao("Fazer retorno");
    setModalProximaAcaoCustom("");
    setModalObservacao("");
    setModalCriarNovaTarefa(true);
    setModalNovoTipoTarefa("Retorno");
    setModalNovaDataTarefa("");
    setModalLancarNaAgenda(false);
    setModalDataAgenda("");
    setModalHoraAgenda("");
    setModalLocalAgenda("");
    setModalRegistrarNoDiario(false);
    setModalTipoAtividadeDiario("Visita Cliente");
    setModalDataDiario(DATA_HOJE());
    setModalHoraDiario("");
    setModalImobiliariaDiario("");
    setModalCorretorDiario("");
    setModalCriarFechamento(false);
    setModalStatusFechamento("Em andamento");
  }

  function aplicarConfiguracaoPorResultado(resultado: string) {
    setModalResultado(resultado);

    const dataSugerida = sugerirDataPorResultado(resultado);
    setModalNovaDataTarefa(dataSugerida);

    if (resultado === "Cliente quer visita") {
      setModalDataAgenda(dataSugerida);
    } else {
      setModalDataAgenda("");
      setModalHoraAgenda("");
      setModalLocalAgenda("");
    }

    setModalDataDiario(DATA_HOJE());

    if (resultado === "Consegui falar com o cliente") {
      setModalProximaAcao("Fazer retorno");
      setModalNovoTipoTarefa("Retorno");
      setModalCriarNovaTarefa(true);
      setModalRegistrarNoDiario(true);
      setModalTipoAtividadeDiario("Atendimento ao Cliente");
      setModalLancarNaAgenda(false);
      setModalCriarFechamento(false);
      setModalStatusFechamento("Em andamento");
      return;
    }

    if (resultado === "Tentei e não consegui") {
      setModalProximaAcao("Nova tentativa de contato");
      setModalNovoTipoTarefa("Nova tentativa");
      setModalCriarNovaTarefa(true);
      setModalRegistrarNoDiario(false);
      setModalLancarNaAgenda(false);
      setModalCriarFechamento(false);
      setModalStatusFechamento("Em andamento");
      return;
    }

    if (resultado === "Cliente pediu retorno") {
      setModalProximaAcao("Fazer retorno");
      setModalNovoTipoTarefa("Retorno");
      setModalCriarNovaTarefa(true);
      setModalRegistrarNoDiario(true);
      setModalTipoAtividadeDiario("Atendimento ao Cliente");
      setModalLancarNaAgenda(false);
      setModalCriarFechamento(false);
      setModalStatusFechamento("Em andamento");
      return;
    }

    if (resultado === "Cliente quer visita") {
      setModalProximaAcao("Confirmar visita");
      setModalNovoTipoTarefa("Confirmar visita");
      setModalCriarNovaTarefa(true);
      setModalLancarNaAgenda(true);
      setModalRegistrarNoDiario(true);
      setModalTipoAtividadeDiario("Visita Cliente");
      setModalCriarFechamento(false);
      setModalStatusFechamento("Em andamento");
      return;
    }

    if (resultado === "Cliente pediu proposta") {
      setModalProximaAcao("Enviar proposta");
      setModalNovoTipoTarefa("Enviar proposta");
      setModalCriarNovaTarefa(true);
      setModalRegistrarNoDiario(true);
      setModalTipoAtividadeDiario("Atendimento ao Cliente");
      setModalCriarFechamento(true);
      setModalStatusFechamento("Proposta enviada");
      return;
    }

    if (resultado === "Cliente sem interesse") {
      setModalProximaAcao("Encerrar lead");
      setModalNovoTipoTarefa("Retorno");
      setModalCriarNovaTarefa(false);
      setModalLancarNaAgenda(false);
      setModalRegistrarNoDiario(false);
      setModalCriarFechamento(false);
      setModalStatusFechamento("Em andamento");
    }
  }

  function abrirModalConclusao(tarefa: Tarefa) {
    resetarModalConclusao();
    setModalTarefaId(tarefa.id);
    setModalTarefaTipo(tarefa.tipo);

    if (tarefa.tipo === "Primeiro contato") {
      aplicarConfiguracaoPorResultado("Consegui falar com o cliente");
      return;
    }

    if (tarefa.tipo === "Retorno") {
      aplicarConfiguracaoPorResultado("Cliente pediu retorno");
      return;
    }

    if (tarefa.tipo === "Confirmar visita") {
      aplicarConfiguracaoPorResultado("Cliente quer visita");
      return;
    }

    aplicarConfiguracaoPorResultado("Consegui falar com o cliente");
  }

  function validarFormularioConclusao() {
    const proximaAcaoFinal =
      modalProximaAcao === "Outra" ? modalProximaAcaoCustom.trim() : modalProximaAcao;

    if (!proximaAcaoFinal) {
      return "Preencha a próxima ação.";
    }

    if (modalCriarNovaTarefa && !modalNovaDataTarefa) {
      return "Escolha a data da nova tarefa.";
    }

    if (modalLancarNaAgenda && !modalDataAgenda) {
      return "Escolha a data para lançar na agenda.";
    }

    if (modalRegistrarNoDiario && !modalDataDiario) {
      return "Escolha a data do registro no Diário de Bordo.";
    }

    return null;
  }

  async function concluirTarefa() {
    if (!modalTarefaId) return;

    const mensagemErroValidacao = validarFormularioConclusao();
    if (mensagemErroValidacao) {
      alert(mensagemErroValidacao);
      return;
    }

    setSalvandoId(modalTarefaId);

    const tarefaAtual = tarefas.find((t) => t.id === modalTarefaId);
    const usuarioAtual = localStorage.getItem("portento_usuario") || "";

    if (!tarefaAtual) {
      alert("Tarefa não encontrada.");
      setSalvandoId(null);
      return;
    }

    const proximaAcaoFinal =
      modalProximaAcao === "Outra" ? modalProximaAcaoCustom.trim() : modalProximaAcao;

    let novaEtapaFunil = "Em atendimento";
    let novoStatusLead = "Em andamento";

    if (modalResultado === "Tentei e não consegui") {
      novaEtapaFunil = "Primeiro Contato";
    }

    if (modalResultado === "Cliente pediu retorno") {
      novaEtapaFunil = "Em atendimento";
    }

    if (modalResultado === "Cliente quer visita") {
      novaEtapaFunil = "Agendado";
    }

    if (modalResultado === "Cliente pediu proposta") {
      novaEtapaFunil = "Proposta";
    }

    if (modalResultado === "Cliente sem interesse") {
      novaEtapaFunil = "Perdido";
      novoStatusLead = "Perdido";
    }

    const { error: tarefaError } = await supabase
      .from("crm_tarefas")
      .update({
        status: "Concluída",
        observacao: modalObservacao || tarefaAtual.observacao,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", modalTarefaId);

    if (tarefaError) {
      console.error(tarefaError);
      alert("Erro ao concluir tarefa.");
      setSalvandoId(null);
      return;
    }

    const leadResumo = await carregarLeadResumo(
      tarefaAtual.lead_id,
      tarefaAtual.gestor || usuarioAtual,
    );

    if (tarefaAtual.lead_id) {
      const { error: leadError } = await supabase
        .from("crm_leads")
        .update({
          status_lead: novoStatusLead,
          etapa_funil: novaEtapaFunil,
          proxima_acao: proximaAcaoFinal,
          ultima_atualizacao: new Date().toISOString(),
        })
        .eq("id", tarefaAtual.lead_id);

      if (leadError) {
        console.error(leadError);
        alert("A tarefa foi concluída, mas deu erro ao atualizar o lead.");
        await carregarTarefas();
        setSalvandoId(null);
        return;
      }

      const descricaoHistorico = `Tarefa "${tarefaAtual.tipo}" concluída com resultado "${modalResultado}". Lead atualizado para status "${novoStatusLead}", etapa "${novaEtapaFunil}" e próxima ação "${proximaAcaoFinal}".${
        modalObservacao ? ` Observação: ${modalObservacao}` : ""
      }`;

      const { error: historicoError } = await supabase.from("crm_historico").insert({
        lead_id: tarefaAtual.lead_id,
        tarefa_id: tarefaAtual.id,
        usuario: usuarioAtual,
        tipo_evento: "tarefa_concluida",
        descricao: descricaoHistorico,
        meta: {
          resultado: modalResultado,
          proximaAcao: proximaAcaoFinal,
          criouNovaTarefa: modalCriarNovaTarefa,
        },
      });

      if (historicoError) {
        console.error(historicoError);
        alert("A tarefa foi concluída e o lead atualizado, mas deu erro ao gravar histórico.");
      }

      if (modalCriarFechamento) {
        const observacaoAutomatica = `Criado/atualizado automaticamente pela conclusão da tarefa "${tarefaAtual.tipo}". Resultado: "${modalResultado}". Próxima ação: "${proximaAcaoFinal}".`;

        const statusAbertos = [
          "Em andamento",
          "Visita realizada",
          "Proposta enviada",
          "Em negociação",
          "Aguardando cliente",
        ];

        let fechamentoExistente: { id: number } | null = null;

        const { data: fechamentoAberto, error: buscaFechamentoError } = await supabase
          .from("crm_fechamentos")
          .select("id")
          .eq("lead_id", tarefaAtual.lead_id)
          .in("status_fechamento", statusAbertos)
          .order("id", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (buscaFechamentoError) {
          console.error(buscaFechamentoError);
        } else if (fechamentoAberto) {
          fechamentoExistente = fechamentoAberto;
        }

        if (fechamentoExistente) {
          const { error: fechamentoUpdateError } = await supabase
            .from("crm_fechamentos")
            .update({
              gestor: leadResumo.gestor,
              cliente: leadResumo.nome,
              telefone: leadResumo.telefone || null,
              produto: leadResumo.produto || null,
              status_fechamento: modalStatusFechamento || "Em andamento",
              descricao_status: modalObservacao.trim() || modalResultado,
              data_status: DATA_HOJE(),
              observacao: observacaoAutomatica,
              updated_at: new Date().toISOString(),
            })
            .eq("id", fechamentoExistente.id);

          if (fechamentoUpdateError) {
            console.error(fechamentoUpdateError);
            alert("A tarefa foi concluída, mas deu erro ao atualizar o fechamento existente.");
          } else {
            const { error: historicoFechamentoError } = await supabase
              .from("crm_historico")
              .insert({
                lead_id: tarefaAtual.lead_id,
                tarefa_id: tarefaAtual.id,
                usuario: usuarioAtual,
                tipo_evento: "fechamento_atualizado",
                descricao: `Fechamento existente atualizado automaticamente pela conclusão da tarefa. Status: "${modalStatusFechamento}".`,
                meta: {
                  origem: "automatica_tarefa",
                  status_fechamento: modalStatusFechamento,
                  resultado: modalResultado,
                  fechamento_id: fechamentoExistente.id,
                },
              });

            if (historicoFechamentoError) {
              console.error(historicoFechamentoError);
              alert("O fechamento foi atualizado, mas deu erro ao gravar isso no histórico.");
            }
          }
        } else {
          const { error: fechamentoInsertError } = await supabase
            .from("crm_fechamentos")
            .insert({
              lead_id: tarefaAtual.lead_id,
              origem: "automatica_tarefa",
              gestor: leadResumo.gestor,
              cliente: leadResumo.nome,
              telefone: leadResumo.telefone || null,
              produto: leadResumo.produto || null,
              status_fechamento: modalStatusFechamento || "Em andamento",
              descricao_status: modalObservacao.trim() || modalResultado,
              data_status: DATA_HOJE(),
              observacao: observacaoAutomatica,
            });

          if (fechamentoInsertError) {
            console.error(fechamentoInsertError);
            alert("A tarefa foi concluída, mas deu erro ao criar o fechamento.");
          } else {
            const { error: historicoFechamentoError } = await supabase
              .from("crm_historico")
              .insert({
                lead_id: tarefaAtual.lead_id,
                tarefa_id: tarefaAtual.id,
                usuario: usuarioAtual,
                tipo_evento: "fechamento_criado",
                descricao: `Fechamento criado automaticamente pela conclusão da tarefa. Status inicial: "${modalStatusFechamento}".`,
                meta: {
                  origem: "automatica_tarefa",
                  status_fechamento: modalStatusFechamento,
                  resultado: modalResultado,
                },
              });

            if (historicoFechamentoError) {
              console.error(historicoFechamentoError);
              alert("O fechamento foi criado, mas deu erro ao gravar isso no histórico.");
            }
          }
        }
      }

      if (modalCriarNovaTarefa) {
        const prazoNovaTarefa = new Date(`${modalNovaDataTarefa}T09:00:00`).toISOString();

        const { error: novaTarefaError } = await supabase.from("crm_tarefas").insert({
          lead_id: tarefaAtual.lead_id,
          tipo: modalNovoTipoTarefa,
          status: "Pendente",
          prazo: prazoNovaTarefa,
          observacao: `Nova tarefa criada após conclusão de "${tarefaAtual.tipo}".${
            modalObservacao ? ` ${modalObservacao}` : ""
          }`,
          gestor: tarefaAtual.gestor || usuarioAtual,
          criado_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString(),
        });

        if (novaTarefaError) {
          console.error(novaTarefaError);
          alert("A tarefa foi concluída, mas deu erro ao criar a nova tarefa.");
        }
      }
    }

    if (modalLancarNaAgenda) {
      const tituloAgenda =
        modalResultado === "Cliente quer visita"
          ? `Visita - ${leadResumo.nome}`
          : `${proximaAcaoFinal} - ${leadResumo.nome}`;

      const descricaoAgenda = `Lead: ${leadResumo.nome}${
        leadResumo.telefone ? ` • Telefone: ${leadResumo.telefone}` : ""
      }. Tarefa de origem: "${tarefaAtual.tipo}". Resultado: "${modalResultado}". Próxima ação: "${proximaAcaoFinal}".${
        modalObservacao ? ` Observação: ${modalObservacao}` : ""
      }`;

      const { error: agendaError } = await supabase.from("crm_agenda").insert({
        criado_por: usuarioAtual,
        responsavel: tarefaAtual.gestor || usuarioAtual,
        titulo: tituloAgenda,
        descricao: descricaoAgenda,
        categoria: modalResultado === "Cliente quer visita" ? "visita" : "compromisso",
        local: modalLocalAgenda.trim() || null,
        data_compromisso: modalDataAgenda,
        hora_compromisso: modalHoraAgenda || null,
        prioridade: "normal",
        status: "pendente",
        observacoes: modalObservacao.trim() || null,
      });

      if (agendaError) {
        console.error(agendaError);
        alert("A tarefa foi concluída, mas deu erro ao lançar na agenda.");
      }
    }

    if (modalRegistrarNoDiario) {
      const { error: diarioError } = await supabase.from("crm_diario_bordo").insert({
        lead_id: tarefaAtual.lead_id,
        tarefa_id: tarefaAtual.id,
        agenda_id: null,
        origem: "tarefa",
        data_registro: modalDataDiario,
        hora_registro: modalHoraDiario || null,
        gestor: leadResumo.gestor,
        cliente: leadResumo.nome,
        telefone: leadResumo.telefone || null,
        produto: leadResumo.produto || null,
        imobiliaria: modalImobiliariaDiario.trim() || leadResumo.imobiliaria || null,
        corretor: modalCorretorDiario.trim() || leadResumo.corretor || null,
        tipo_atividade: modalTipoAtividadeDiario,
        resultado: modalResultado,
        observacao: modalObservacao || null,
      });

      if (diarioError) {
        console.error(diarioError);
        alert("A tarefa foi concluída, mas deu erro ao registrar no Diário de Bordo.");
      } else if (tarefaAtual.lead_id) {
        const { error: historicoDiarioError } = await supabase.from("crm_historico").insert({
          lead_id: tarefaAtual.lead_id,
          tarefa_id: tarefaAtual.id,
          usuario: usuarioAtual,
          tipo_evento: "diario_registrado",
          descricao: `Registro lançado no Diário de Bordo. Tipo: "${modalTipoAtividadeDiario}". Resultado: "${modalResultado}".`,
          meta: {
            origem: "tarefa",
            data_registro: modalDataDiario,
            hora_registro: modalHoraDiario || null,
            tipo_atividade: modalTipoAtividadeDiario,
          },
        });

        if (historicoDiarioError) {
          console.error(historicoDiarioError);
          alert("O Diário foi registrado, mas deu erro ao gravar isso no histórico.");
        }
      }
    }

    await carregarTarefas();
    resetarModalConclusao();
    setSalvandoId(null);
  }

  function getPrioridadeOrdenacao(statusVisual: string) {
    if (statusVisual === "Atrasada") return 0;
    if (statusVisual === "Pendente") return 1;
    if (statusVisual === "Concluída") return 2;
    return 3;
  }

  function formatarPrazo(prazo: string | null) {
    if (!prazo) return "-";

    return new Date(prazo).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function isMesmoDia(dataA: string | null, dataB: string) {
    if (!dataA) return false;
    return dataA === dataB;
  }

  function isNosProximosDias(data: string | null, dias: number) {
    if (!data) return false;

    const hoje = new Date(`${DATA_HOJE()}T00:00:00`);
    const limite = new Date(`${DATA_HOJE()}T00:00:00`);
    limite.setDate(limite.getDate() + dias);
    const dataComparada = new Date(`${data}T00:00:00`);

    return dataComparada >= hoje && dataComparada <= limite;
  }

  function getClasseBadgeStatus(statusVisual: string) {
    if (statusVisual === "Atrasada") {
      return "bg-red-100 text-red-700 border border-red-200";
    }

    if (statusVisual === "Pendente") {
      return "bg-amber-100 text-amber-700 border border-amber-200";
    }

    if (statusVisual === "Concluída") {
      return "bg-green-100 text-green-700 border border-green-200";
    }

    return "bg-slate-100 text-slate-700 border border-slate-200";
  }

  const tiposDisponiveis = useMemo(() => {
    return Array.from(
      new Set(
        tarefas
          .map((tarefa) => tarefa.tipo?.trim())
          .filter((tipo): tipo is string => Boolean(tipo))
      )
    ).sort((a: string, b: string) => a.localeCompare(b, "pt-BR"));
  }, [tarefas]);

  const tarefasFiltradas = useMemo(() => {
    return tarefas
      .filter((tarefa) => {
        const statusVisual = getStatusVisual(tarefa);

        const matchStatus =
          filtroStatus === "todos" ||
          (filtroStatus === "abertas" && statusVisual !== "Concluída") ||
          statusVisual.toLowerCase() === filtroStatus.toLowerCase();

        const matchTipo = filtroTipo === "todos" || tarefa.tipo === filtroTipo;

        const matchPrazo =
          filtroPrazo === "todos" ||
          (filtroPrazo === "hoje" && isMesmoDia(tarefa.prazo, DATA_HOJE())) ||
          (filtroPrazo === "proximos_7_dias" && isNosProximosDias(tarefa.prazo, 7)) ||
          (filtroPrazo === "sem_prazo" && !tarefa.prazo);

        const matchGestor =
          perfil !== "gestor" || (tarefa.gestor || "").toLowerCase() === usuarioLogado;

        return matchStatus && matchTipo && matchPrazo && matchGestor;
      })
      .sort((a, b) => {
        const statusA = getStatusVisual(a);
        const statusB = getStatusVisual(b);

        const prioridadeA = getPrioridadeOrdenacao(statusA);
        const prioridadeB = getPrioridadeOrdenacao(statusB);

        if (prioridadeA !== prioridadeB) {
          return prioridadeA - prioridadeB;
        }

        const prazoA = a.prazo ? new Date(a.prazo).getTime() : Number.MAX_SAFE_INTEGER;
        const prazoB = b.prazo ? new Date(b.prazo).getTime() : Number.MAX_SAFE_INTEGER;

        return prazoA - prazoB;
      });
  }, [tarefas, filtroStatus, filtroTipo, filtroPrazo, perfil, usuarioLogado]);

  const total = tarefasFiltradas.length;
  const pendentes = tarefasFiltradas.filter((t) => getStatusVisual(t) === "Pendente").length;
  const atrasadas = tarefasFiltradas.filter((t) => getStatusVisual(t) === "Atrasada").length;
  const concluidas = tarefasFiltradas.filter((t) => getStatusVisual(t) === "Concluída").length;

  return (
    <main className="min-h-screen bg-slate-100 px-3 py-4 sm:px-4 sm:py-6 lg:px-6 xl:px-8 2xl:px-10">
      <div className="mx-auto w-full max-w-[1600px]">
        <section className="mb-6 rounded-3xl bg-slate-900 px-5 py-5 text-white shadow-xl sm:px-6 sm:py-6 lg:px-8 lg:py-7">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-300">
            CRM
          </p>

          <h1 className="mt-2 text-2xl font-bold sm:text-3xl lg:text-4xl xl:text-[2.6rem]">Tarefas CRM</h1>

          <p className="mt-3 max-w-3xl text-sm text-slate-200 sm:text-base">
            Pendências, retornos, prazos e próximas ações ligadas aos leads do CRM.
          </p>

          <p className="mt-3 text-sm text-slate-300">
            Usuário logado: <strong>{nomeUsuario || "Carregando..."}</strong>
          </p>
        </section>

        <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
            <p className="text-sm text-slate-500">Total de tarefas</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">{total}</h2>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
            <p className="text-sm text-slate-500">Pendentes</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">{pendentes}</h2>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
            <p className="text-sm text-slate-500">Atrasadas</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">{atrasadas}</h2>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
            <p className="text-sm text-slate-500">Concluídas</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">{concluidas}</h2>
          </div>
        </section>

        <section className="mb-5 rounded-2xl bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Filtrar por status
              </label>

              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
              >
                <option value="abertas">Em aberto</option>
                <option value="todos">Todos</option>
                <option value="pendente">Pendente</option>
                <option value="atrasada">Atrasada</option>
                <option value="concluída">Concluída</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Filtrar por tipo
              </label>

              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
              >
                <option value="todos">Todos os tipos</option>
                {tiposDisponiveis.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Filtrar por prazo
              </label>

              <select
                value={filtroPrazo}
                onChange={(e) => setFiltroPrazo(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
              >
                <option value="todos">Todos os prazos</option>
                <option value="hoje">Vence hoje</option>
                <option value="proximos_7_dias">Próximos 7 dias</option>
                <option value="sem_prazo">Sem prazo</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setFiltroStatus("abertas");
                  setFiltroTipo("todos");
                  setFiltroPrazo("todos");
                }}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Limpar filtros
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
          {carregando ? (
            <p className="text-slate-600">Carregando tarefas...</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl">
              <table className="w-full min-w-[980px] border-collapse xl:min-w-full">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="px-3 py-3 text-sm font-bold text-slate-700">Prazo</th>
                    <th className="px-3 py-3 text-sm font-bold text-slate-700">Status</th>
                    <th className="px-3 py-3 text-sm font-bold text-slate-700">Cliente</th>
                    <th className="px-3 py-3 text-sm font-bold text-slate-700">Telefone</th>
                    <th className="px-3 py-3 text-sm font-bold text-slate-700">Produto</th>
                    <th className="px-3 py-3 text-sm font-bold text-slate-700">Tipo</th>
                    <th className="px-3 py-3 text-sm font-bold text-slate-700">Observação</th>
                    <th className="px-3 py-3 text-sm font-bold text-slate-700">Gestor</th>
                    <th className="px-3 py-3 text-sm font-bold text-slate-700">Ação</th>
                  </tr>
                </thead>

                <tbody>
                  {tarefasFiltradas.map((tarefa) => {
                    const statusVisual = getStatusVisual(tarefa);
                    const concluida = statusVisual === "Concluída";
                    const atrasada = statusVisual === "Atrasada";

                    return (
                      <tr
                        key={tarefa.id}
                        className={`border-b border-slate-100 ${atrasada ? "bg-red-50/60" : "bg-white"}`}
                      >
                        <td className="px-3 py-3 text-sm text-slate-700">
                          <div className="font-medium text-slate-800">{formatarPrazo(tarefa.prazo)}</div>
                          <div className="text-xs text-slate-500">Lead #{tarefa.lead_id ?? "-"}</div>
                        </td>
                        <td className="px-3 py-3 text-sm text-slate-700">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getClasseBadgeStatus(statusVisual)}`}
                          >
                            {statusVisual}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-sm text-slate-700">
                          <div className="font-semibold text-slate-800">
                            {tarefa.cliente_nome || `Lead ${tarefa.lead_id ?? "-"}`}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sm text-slate-700">
                          {tarefa.cliente_telefone || "-"}
                        </td>
                        <td className="px-3 py-3 text-sm text-slate-700">
                          {tarefa.cliente_produto || "-"}
                        </td>
                        <td className="px-3 py-3 text-sm text-slate-700">{tarefa.tipo}</td>
                        <td className="px-3 py-3 text-sm text-slate-700">{tarefa.observacao || "-"}</td>
                        <td className="px-3 py-3 text-sm text-slate-700">{tarefa.gestor || "-"}</td>
                        <td className="px-3 py-3 text-sm">
                          {concluida ? (
                            <span className="text-xs font-semibold text-green-700">Concluída</span>
                          ) : (
                            <button
                              onClick={() => abrirModalConclusao(tarefa)}
                              className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
                            >
                              Concluir
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {modalTarefaId && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-2 sm:items-center sm:p-4">
          <div className="w-full max-w-[98vw] overflow-hidden rounded-3xl bg-white shadow-2xl sm:max-w-3xl xl:max-w-5xl">
            <div className="max-h-[92vh] overflow-y-auto p-4 sm:p-5 lg:p-6"><h2 className="mb-2 text-xl font-bold text-slate-900 sm:text-2xl">Concluir tarefa</h2>

            <p className="text-sm text-slate-600">
              Tarefa selecionada: <strong>{modalTarefaTipo}</strong>
            </p>

            {tarefaSelecionada && (
              <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cliente</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {tarefaSelecionada.cliente_nome || `Lead ${tarefaSelecionada.lead_id ?? "-"}`}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Telefone</p>
                  <p className="mt-1 text-sm text-slate-800">{tarefaSelecionada.cliente_telefone || "-"}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Produto</p>
                  <p className="mt-1 text-sm text-slate-800">{tarefaSelecionada.cliente_produto || "-"}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Prazo atual</p>
                  <p className="mt-1 text-sm text-slate-800">{formatarPrazo(tarefaSelecionada.prazo)}</p>
                </div>
              </div>
            )}

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Resultado da tarefa
                </label>
                <select
                  value={modalResultado}
                  onChange={(e) => aplicarConfiguracaoPorResultado(e.target.value)}
                  className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                >
                  <option value="Consegui falar com o cliente">
                    Consegui falar com o cliente
                  </option>
                  <option value="Tentei e não consegui">Tentei e não consegui</option>
                  <option value="Cliente pediu retorno">Cliente pediu retorno</option>
                  <option value="Cliente quer visita">Cliente quer visita</option>
                  <option value="Cliente pediu proposta">Cliente pediu proposta</option>
                  <option value="Cliente sem interesse">Cliente sem interesse</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Observação</label>
                <textarea
                  value={modalObservacao}
                  onChange={(e) => setModalObservacao(e.target.value)}
                  rows={4}
                  className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                  placeholder="Digite uma observação sobre o andamento"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Próxima ação</label>
                <select
                  value={modalProximaAcao}
                  onChange={(e) => setModalProximaAcao(e.target.value)}
                  className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                >
                  <option value="Fazer retorno">Fazer retorno</option>
                  <option value="Nova tentativa de contato">Nova tentativa de contato</option>
                  <option value="Agendar visita">Agendar visita</option>
                  <option value="Confirmar visita">Confirmar visita</option>
                  <option value="Enviar proposta">Enviar proposta</option>
                  <option value="Aguardar cliente">Aguardar cliente</option>
                  <option value="Realizar visita">Realizar visita</option>
                  <option value="Encerrar lead">Encerrar lead</option>
                  <option value="Outra">Outra</option>
                </select>

                {modalProximaAcao === "Outra" && (
                  <input
                    type="text"
                    value={modalProximaAcaoCustom}
                    onChange={(e) => setModalProximaAcaoCustom(e.target.value)}
                    placeholder="Digite a próxima ação"
                    className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                  />
                )}
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={modalCriarNovaTarefa}
                    onChange={(e) => setModalCriarNovaTarefa(e.target.checked)}
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Criar nova tarefa também
                  </span>
                </label>

                {modalCriarNovaTarefa && (
                  <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    O sistema já sugere uma data para a próxima tarefa. Você pode alterar se quiser.
                  </div>
                )}

                {modalCriarNovaTarefa && (
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">
                        Tipo da nova tarefa
                      </label>
                      <select
                        value={modalNovoTipoTarefa}
                        onChange={(e) => setModalNovoTipoTarefa(e.target.value)}
                        className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                      >
                        <option value="Retorno">Retorno</option>
                        <option value="Nova tentativa">Nova tentativa</option>
                        <option value="Confirmar visita">Confirmar visita</option>
                        <option value="Enviar proposta">Enviar proposta</option>
                        <option value="Realizar visita">Realizar visita</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700">
                        Data da nova tarefa
                      </label>
                      <input
                        type="date"
                        value={modalNovaDataTarefa}
                        min={DATA_HOJE()}
                        onChange={(e) => setModalNovaDataTarefa(e.target.value)}
                        className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={modalRegistrarNoDiario}
                    onChange={(e) => setModalRegistrarNoDiario(e.target.checked)}
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Registrar no Diário de Bordo também
                  </span>
                </label>

                {modalRegistrarNoDiario && (
                  <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    Use o Diário para registrar atendimento, visita, reunião e contexto importante da ação.
                  </div>
                )}

                {modalRegistrarNoDiario && (
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700">
                        Tipo da atividade
                      </label>
                      <select
                        value={modalTipoAtividadeDiario}
                        onChange={(e) => setModalTipoAtividadeDiario(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      >
                        <option value="Visita Cliente">Visita Cliente</option>
                        <option value="Visita Imobiliária">Visita Imobiliária</option>
                        <option value="Atendimento ao Cliente">Atendimento ao Cliente</option>
                        <option value="Ligações Leads">Ligações Leads</option>
                        <option value="Flow Up Corretores">Flow Up Corretores</option>
                        <option value="Reunião">Reunião</option>
                        <option value="Feirão">Feirão</option>
                        <option value="Ação de Rua">Ação de Rua</option>
                        <option value="Aprovação">Aprovação</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700">
                        Data do registro
                      </label>
                      <input
                        type="date"
                        value={modalDataDiario}
                        onChange={(e) => setModalDataDiario(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700">Hora</label>
                      <input
                        type="time"
                        value={modalHoraDiario}
                        onChange={(e) => setModalHoraDiario(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700">
                        Imobiliária
                      </label>
                      <input
                        type="text"
                        value={modalImobiliariaDiario}
                        onChange={(e) => setModalImobiliariaDiario(e.target.value)}
                        placeholder="Digite a imobiliária"
                        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700">Corretor</label>
                      <input
                        type="text"
                        value={modalCorretorDiario}
                        onChange={(e) => setModalCorretorDiario(e.target.value)}
                        placeholder="Digite o corretor"
                        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={modalCriarFechamento}
                    onChange={(e) => setModalCriarFechamento(e.target.checked)}
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Criar acompanhamento em Fechamentos também
                  </span>
                </label>

                {modalCriarFechamento && (
                  <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                    Ative isso quando a tarefa já virou acompanhamento comercial em Fechamentos.
                  </div>
                )}

                {modalCriarFechamento && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700">
                      Status inicial do fechamento
                    </label>
                    <select
                      value={modalStatusFechamento}
                      onChange={(e) => setModalStatusFechamento(e.target.value)}
                      className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="Em andamento">Em andamento</option>
                      <option value="Visita realizada">Visita realizada</option>
                      <option value="Proposta enviada">Proposta enviada</option>
                      <option value="Em negociação">Em negociação</option>
                      <option value="Aguardando cliente">Aguardando cliente</option>
                      <option value="Fechado">Fechado</option>
                      <option value="Perdido">Perdido</option>
                      <option value="Cancelado">Cancelado</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={modalLancarNaAgenda}
                    onChange={(e) => setModalLancarNaAgenda(e.target.checked)}
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Lançar na Minha Agenda também
                  </span>
                </label>

                {modalLancarNaAgenda && (
                  <div className="mt-3 rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-800">
                    Ideal para visita, reunião, proposta presencial ou qualquer compromisso com data marcada.
                  </div>
                )}

                {modalLancarNaAgenda && (
                  <div className="mt-4 grid gap-4 lg:grid-cols-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">
                        Data na agenda
                      </label>
                      <input
                        type="date"
                        value={modalDataAgenda}
                        min={DATA_HOJE()}
                        onChange={(e) => setModalDataAgenda(e.target.value)}
                        className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700">Hora</label>
                      <input
                        type="time"
                        value={modalHoraAgenda}
                        onChange={(e) => setModalHoraAgenda(e.target.value)}
                        className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700">Local</label>
                      <input
                        type="text"
                        value={modalLocalAgenda}
                        onChange={(e) => setModalLocalAgenda(e.target.value)}
                        placeholder="Ex.: obra, stand, escritório"
                        className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 bg-white pt-4 sm:flex-row sm:justify-end">
              <button onClick={resetarModalConclusao} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto">
                Cancelar
              </button>

              <button
                onClick={concluirTarefa}
                disabled={salvandoId === modalTarefaId}
                className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {salvandoId === modalTarefaId ? "Salvando..." : "Continuar"}
              </button>
            </div>
          </div>
          </div>
        </div>
      )}
    </main>
  );
}
