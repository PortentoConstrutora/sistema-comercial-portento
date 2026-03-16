"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type Lead = Record<string, any>;
type Tarefa = Record<string, any>;
type Gestor = Record<string, any>;

type ComparativoGestor = {
  gestor: string;
  leads: number;
  novos: number;
  andamento: number;
  agendados: number;
  pendentes: number;
  atrasadas: number;
  semAtualizacao: number;
};

type OrigemResumo = {
  origem: string;
  total: number;
};

type FunilResumo = {
  label: string;
  total: number;
};

function normalizarTexto(valor: any) {
  return String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function pegarPrimeiroCampo(obj: Record<string, any>, campos: string[]) {
  for (const campo of campos) {
    if (obj?.[campo] !== undefined && obj?.[campo] !== null && obj?.[campo] !== "") {
      return obj[campo];
    }
  }
  return null;
}

function formatarNomeExibicao(valor: any) {
  const texto = String(valor || "").trim();
  if (!texto) return "Não informado";
  return texto;
}

function dataValida(valor: any) {
  if (!valor) return null;
  const data = new Date(valor);
  if (isNaN(data.getTime())) return null;
  return data;
}

function inicioDoDia(data = new Date()) {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate(), 0, 0, 0, 0);
}

function inicioDaSemana(data = new Date()) {
  const copia = new Date(data);
  const dia = copia.getDay();
  const ajuste = dia === 0 ? -6 : 1 - dia;
  copia.setDate(copia.getDate() + ajuste);
  copia.setHours(0, 0, 0, 0);
  return copia;
}

function diasSemAtualizacao(item: Record<string, any>) {
  const ultimaData =
    dataValida(
      pegarPrimeiroCampo(item, [
        "updated_at",
        "data_atualizacao",
        "ultima_atualizacao",
        "data_ultima_atualizacao",
        "modified_at",
      ])
    ) ||
    dataValida(
      pegarPrimeiroCampo(item, [
        "data_entrada",
        "created_at",
        "data_cadastro",
        "criado_em",
      ])
    );

  if (!ultimaData) return 9999;

  const agora = new Date();
  const diffMs = agora.getTime() - ultimaData.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function statusLeadNormalizado(lead: Lead) {
  return normalizarTexto(
    pegarPrimeiroCampo(lead, [
      "status",
      "etapa",
      "fase",
      "situacao",
      "status_lead",
    ])
  );
}

function nomeGestorDoLead(lead: Lead) {
  return formatarNomeExibicao(
    pegarPrimeiroCampo(lead, [
      "gestor",
      "gestor_nome",
      "responsavel",
      "responsavel_nome",
      "corretor",
      "corretor_nome",
      "usuario_responsavel",
      "atendente",
    ])
  );
}

function nomeGestorDaTarefa(tarefa: Tarefa) {
  return formatarNomeExibicao(
    pegarPrimeiroCampo(tarefa, [
      "gestor",
      "gestor_nome",
      "responsavel",
      "responsavel_nome",
      "usuario",
      "usuario_nome",
      "corretor",
      "corretor_nome",
    ])
  );
}

function statusTarefaNormalizado(tarefa: Tarefa) {
  return normalizarTexto(
    pegarPrimeiroCampo(tarefa, [
      "status",
      "situacao",
      "estado",
    ])
  );
}

function dataPrazoTarefa(tarefa: Tarefa) {
  return dataValida(
    pegarPrimeiroCampo(tarefa, [
      "data_prazo",
      "prazo",
      "vencimento",
      "data_vencimento",
      "deadline",
    ])
  );
}

export default function DiretoriaPage() {
  const router = useRouter();

  const [carregando, setCarregando] = useState(true);
  const [permitido, setPermitido] = useState(false);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [gestores, setGestores] = useState<Gestor[]>([]);

  async function carregarDados() {
    try {
      const [resLeads, resTarefas, resGestores] = await Promise.all([
        supabase.from("crm_leads").select("*").order("id", { ascending: false }),
        supabase.from("crm_tarefas").select("*").order("id", { ascending: false }),
        supabase.from("crm_gestores").select("*").order("id", { ascending: true }),
      ]);

      if (resLeads.error) {
        console.error("Erro ao buscar crm_leads:", resLeads.error);
      } else {
        setLeads(resLeads.data || []);
      }

      if (resTarefas.error) {
        console.error("Erro ao buscar crm_tarefas:", resTarefas.error);
      } else {
        setTarefas(resTarefas.data || []);
      }

      if (resGestores.error) {
        console.error("Erro ao buscar crm_gestores:", resGestores.error);
      } else {
        setGestores(resGestores.data || []);
      }
    } catch (error) {
      console.error("Erro geral ao carregar dados da diretoria:", error);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    const perfilSalvo = localStorage.getItem("portento_perfil") || "";
    const logadoSalvo = localStorage.getItem("portento_logado") === "sim";

    if (!logadoSalvo) {
      window.location.href = "/login";
      return;
    }

    if (perfilSalvo === "diretoria" || perfilSalvo === "admin") {
      setPermitido(true);
      carregarDados();
      return;
    }

    window.location.href = "/crm";
  }, [router]);

  const indicadores = useMemo(() => {
    const hoje = new Date();
    const inicioHojeData = inicioDoDia(hoje);
    const inicioSemanaData = inicioDaSemana(hoje);

    const totalLeads = leads.length;

    const leadsNovosHoje = leads.filter((lead) => {
      const data = dataValida(
        pegarPrimeiroCampo(lead, ["data_entrada", "created_at", "data_cadastro"])
      );
      return data ? data >= inicioHojeData : false;
    }).length;

    const leadsSemana = leads.filter((lead) => {
      const data = dataValida(
        pegarPrimeiroCampo(lead, ["data_entrada", "created_at", "data_cadastro"])
      );
      return data ? data >= inicioSemanaData : false;
    }).length;

    const tarefasPendentes = tarefas.filter((tarefa) => {
      const status = statusTarefaNormalizado(tarefa);
      return !["concluida", "concluido", "finalizada", "finalizado", "feita"].includes(status);
    }).length;

    const tarefasAtrasadas = tarefas.filter((tarefa) => {
      const status = statusTarefaNormalizado(tarefa);
      const prazo = dataPrazoTarefa(tarefa);
      if (!prazo) return false;
      if (["concluida", "concluido", "finalizada", "finalizado", "feita"].includes(status)) {
        return false;
      }
      return prazo < new Date();
    }).length;

    const leadsSemAtualizacao = leads.filter((lead) => diasSemAtualizacao(lead) >= 3).length;

    return {
      totalLeads,
      leadsNovosHoje,
      leadsSemana,
      tarefasPendentes,
      tarefasAtrasadas,
      leadsSemAtualizacao,
    };
  }, [leads, tarefas]);

  const funilGeral = useMemo<FunilResumo[]>(() => {
    const mapa = {
      novo: 0,
      primeiroContato: 0,
      andamento: 0,
      agendado: 0,
      visitou: 0,
      fechado: 0,
      perdido: 0,
    };

    leads.forEach((lead) => {
      const status = statusLeadNormalizado(lead);

      if (status.includes("novo")) mapa.novo += 1;
      else if (status.includes("primeiro") || status.includes("contato")) mapa.primeiroContato += 1;
      else if (status.includes("andamento")) mapa.andamento += 1;
      else if (status.includes("agend")) mapa.agendado += 1;
      else if (status.includes("visit")) mapa.visitou += 1;
      else if (status.includes("fech")) mapa.fechado += 1;
      else if (status.includes("perd")) mapa.perdido += 1;
      else mapa.andamento += 1;
    });

    return [
      { label: "Novo", total: mapa.novo },
      { label: "Primeiro contato", total: mapa.primeiroContato },
      { label: "Em andamento", total: mapa.andamento },
      { label: "Agendado", total: mapa.agendado },
      { label: "Visitou", total: mapa.visitou },
      { label: "Fechado", total: mapa.fechado },
      { label: "Perdido", total: mapa.perdido },
    ];
  }, [leads]);

  const origensResumo = useMemo<OrigemResumo[]>(() => {
    const mapa = new Map<string, number>();

    leads.forEach((lead) => {
      const origem = formatarNomeExibicao(
        pegarPrimeiroCampo(lead, ["origem", "canal", "fonte"])
      );
      mapa.set(origem, (mapa.get(origem) || 0) + 1);
    });

    return Array.from(mapa.entries())
      .map(([origem, total]) => ({ origem, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [leads]);

const comparativoGestores = useMemo<ComparativoGestor[]>(() => {
  const gestoresFixos = ["Paloma", "Márcio"];

  return gestoresFixos.map((gestor) => {
    const leadsDoGestor = leads.filter((lead) => {
      const nome = normalizarTexto(nomeGestorDoLead(lead));
      return nome === normalizarTexto(gestor);
    });

    const tarefasDoGestor = tarefas.filter((tarefa) => {
      const nome = normalizarTexto(nomeGestorDaTarefa(tarefa));
      return nome === normalizarTexto(gestor);
    });

    const pendentes = tarefasDoGestor.filter((tarefa) => {
      const status = statusTarefaNormalizado(tarefa);
      return !["concluida", "concluido", "finalizada", "finalizado", "feita"].includes(status);
    }).length;

    const atrasadas = tarefasDoGestor.filter((tarefa) => {
      const status = statusTarefaNormalizado(tarefa);
      const prazo = dataPrazoTarefa(tarefa);

      if (!prazo) return false;

      if (["concluida", "concluido", "finalizada", "finalizado", "feita"].includes(status)) {
        return false;
      }

      return prazo < new Date();
    }).length;

    const semAtualizacao = leadsDoGestor.filter(
      (lead) => diasSemAtualizacao(lead) >= 3
    ).length;

    const novos = leadsDoGestor.filter((lead) =>
      statusLeadNormalizado(lead).includes("novo")
    ).length;

    const andamento = leadsDoGestor.filter((lead) =>
      statusLeadNormalizado(lead).includes("andamento")
    ).length;

    const agendados = leadsDoGestor.filter((lead) =>
      statusLeadNormalizado(lead).includes("agend")
    ).length;

    return {
      gestor,
      leads: leadsDoGestor.length,
      novos,
      andamento,
      agendados,
      pendentes,
      atrasadas,
      semAtualizacao,
    };
  });
}, [leads, tarefas]);

  const alertas = useMemo(() => {
    const gestorMaisPendencias =
      [...comparativoGestores].sort((a, b) => b.pendentes - a.pendentes)[0] || null;

    const gestorMaisAtrasos =
      [...comparativoGestores].sort((a, b) => b.atrasadas - a.atrasadas)[0] || null;

    const origemMaiorVolume = origensResumo[0] || null;

    return {
      gestorMaisPendencias,
      gestorMaisAtrasos,
      origemMaiorVolume,
      leadsParados: indicadores.leadsSemAtualizacao,
    };
  }, [comparativoGestores, origensResumo, indicadores.leadsSemAtualizacao]);

  if (carregando) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-6xl rounded-2xl bg-white p-8 shadow">
          <h1 className="text-2xl font-bold text-slate-900">Carregando painel da diretoria...</h1>
          <p className="mt-3 text-slate-600">Aguarde enquanto buscamos os indicadores.</p>
        </div>
      </main>
    );
  }

  if (!permitido) return null;

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-3xl bg-slate-900 px-6 py-8 text-white shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-300">
            Portento Construtora
          </p>
          <h1 className="mt-3 text-3xl font-bold">Painel da Diretoria</h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-200">
            Visão executiva do CRM com indicadores gerais, comparação por gestor,
            funil comercial, origens e alertas de atenção.
          </p>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total de Leads</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">{indicadores.totalLeads}</h2>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Leads Novos Hoje</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">{indicadores.leadsNovosHoje}</h2>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Leads da Semana</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">{indicadores.leadsSemana}</h2>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Tarefas Pendentes</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">{indicadores.tarefasPendentes}</h2>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Tarefas Atrasadas</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">{indicadores.tarefasAtrasadas}</h2>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Sem Atualização 3+ dias</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">{indicadores.leadsSemAtualizacao}</h2>
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Funil Geral</h3>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                CRM
              </span>
            </div>

            <div className="space-y-3">
              {funilGeral.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3"
                >
                  <span className="text-sm font-medium text-slate-700">{item.label}</span>
                  <span className="text-lg font-bold text-slate-900">{item.total}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Leads por Origem</h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                Top origens
              </span>
            </div>

            <div className="space-y-3">
              {origensResumo.length ? (
                origensResumo.map((item) => (
                  <div
                    key={item.origem}
                    className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3"
                  >
                    <span className="text-sm font-medium text-slate-700">{item.origem}</span>
                    <span className="text-lg font-bold text-slate-900">{item.total}</span>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                  Nenhuma origem encontrada.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Comparativo por Gestor</h3>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              Diretoria
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-sm text-slate-500">
                  <th className="px-3 py-2">Gestor</th>
                  <th className="px-3 py-2">Leads</th>
                  <th className="px-3 py-2">Novos</th>
                  <th className="px-3 py-2">Andamento</th>
                  <th className="px-3 py-2">Agendados</th>
                  <th className="px-3 py-2">Pendentes</th>
                  <th className="px-3 py-2">Atrasadas</th>
                  <th className="px-3 py-2">Sem atualização</th>
                </tr>
              </thead>

              <tbody>
                {comparativoGestores.length ? (
                  comparativoGestores.map((item) => (
                    <tr key={item.gestor} className="rounded-2xl bg-slate-50 text-sm text-slate-800">
                      <td className="rounded-l-2xl px-3 py-3 font-semibold">{item.gestor}</td>
                      <td className="px-3 py-3">{item.leads}</td>
                      <td className="px-3 py-3">{item.novos}</td>
                      <td className="px-3 py-3">{item.andamento}</td>
                      <td className="px-3 py-3">{item.agendados}</td>
                      <td className="px-3 py-3">{item.pendentes}</td>
                      <td className="px-3 py-3">{item.atrasadas}</td>
                      <td className="rounded-r-2xl px-3 py-3">{item.semAtualizacao}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-center text-sm text-slate-500">
                      Ainda não foi possível montar o comparativo por gestor com os campos atuais.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Alertas da Diretoria</h3>
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                Atenção
              </span>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 px-4 py-3">
                <p className="text-sm text-slate-500">Gestor com mais pendências</p>
                <p className="mt-1 text-base font-bold text-slate-900">
                  {alertas.gestorMaisPendencias
                    ? `${alertas.gestorMaisPendencias.gestor} (${alertas.gestorMaisPendencias.pendentes})`
                    : "Sem dados"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 px-4 py-3">
                <p className="text-sm text-slate-500">Gestor com mais atrasos</p>
                <p className="mt-1 text-base font-bold text-slate-900">
                  {alertas.gestorMaisAtrasos
                    ? `${alertas.gestorMaisAtrasos.gestor} (${alertas.gestorMaisAtrasos.atrasadas})`
                    : "Sem dados"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 px-4 py-3">
                <p className="text-sm text-slate-500">Leads parados há 3+ dias</p>
                <p className="mt-1 text-base font-bold text-slate-900">{alertas.leadsParados}</p>
              </div>

              <div className="rounded-xl border border-slate-200 px-4 py-3">
                <p className="text-sm text-slate-500">Origem com maior volume</p>
                <p className="mt-1 text-base font-bold text-slate-900">
                  {alertas.origemMaiorVolume
                    ? `${alertas.origemMaiorVolume.origem} (${alertas.origemMaiorVolume.total})`
                    : "Sem dados"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Resumo Executivo</h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                Visão geral
              </span>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 px-4 py-3">
                <p className="text-sm text-slate-500">Gestores encontrados</p>
<p className="mt-1 text-base font-bold text-slate-900">2</p>
              </div>

              <div className="rounded-xl border border-slate-200 px-4 py-3">
                <p className="text-sm text-slate-500">Top gestor por volume de leads</p>
                <p className="mt-1 text-base font-bold text-slate-900">
                  {comparativoGestores[0]
                    ? `${comparativoGestores[0].gestor} (${comparativoGestores[0].leads})`
                    : "Sem dados"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 px-4 py-3">
                <p className="text-sm text-slate-500">Total de tarefas carregadas</p>
                <p className="mt-1 text-base font-bold text-slate-900">{tarefas.length}</p>
              </div>

              <div className="rounded-xl border border-slate-200 px-4 py-3">
                <p className="text-sm text-slate-500">Total de origens mapeadas</p>
                <p className="mt-1 text-base font-bold text-slate-900">{origensResumo.length}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}