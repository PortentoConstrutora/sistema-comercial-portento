"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type AgendaItem = {
  id: number;
  criado_por: string | null;
  responsavel: string;
  titulo: string;
  descricao: string | null;
  categoria: string;
  local: string | null;
  data_compromisso: string;
  hora_compromisso: string | null;
  prioridade: string;
  status: string;
  observacoes: string | null;
};

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function formatarDataISO(data: Date) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function formatarHora(hora?: string | null) {
  if (!hora) return "";
  return hora.slice(0, 5);
}

function obterPrimeiroDiaMes(dataBase: Date) {
  return new Date(dataBase.getFullYear(), dataBase.getMonth(), 1);
}

function obterUltimoDiaMes(dataBase: Date) {
  return new Date(dataBase.getFullYear(), dataBase.getMonth() + 1, 0);
}

function montarGradeMes(dataBase: Date) {
  const primeiroDia = obterPrimeiroDiaMes(dataBase);
  const ultimoDia = obterUltimoDiaMes(dataBase);

  const inicioGrade = new Date(primeiroDia);
  inicioGrade.setDate(primeiroDia.getDate() - primeiroDia.getDay());

  const fimGrade = new Date(ultimoDia);
  fimGrade.setDate(ultimoDia.getDate() + (6 - ultimoDia.getDay()));

  const dias: Date[] = [];
  const cursor = new Date(inicioGrade);

  while (cursor <= fimGrade) {
    dias.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dias;
}

export default function MinhaAgendaPage() {
  const router = useRouter();

  const [carregado, setCarregado] = useState(false);
  const [usuario, setUsuario] = useState("");
  const [nome, setNome] = useState("");
  const [perfil, setPerfil] = useState("");

  const [mesAtual, setMesAtual] = useState<Date>(new Date());
  const [diaSelecionado, setDiaSelecionado] = useState<string>(formatarDataISO(new Date()));

  const [itens, setItens] = useState<AgendaItem[]>([]);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("compromisso");
  const [local, setLocal] = useState("");
  const [dataCompromisso, setDataCompromisso] = useState(formatarDataISO(new Date()));
  const [horaCompromisso, setHoraCompromisso] = useState("");
  const [prioridade, setPrioridade] = useState("normal");
  const [status, setStatus] = useState("pendente");
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    const logado = localStorage.getItem("portento_logado");
    const usuarioSalvo = localStorage.getItem("portento_usuario") || "";
    const nomeSalvo = localStorage.getItem("portento_nome") || "";
    const perfilSalvo = localStorage.getItem("portento_perfil") || "";

    if (logado !== "sim") {
      router.push("/login");
      return;
    }

    setUsuario(usuarioSalvo);
    setNome(nomeSalvo);
    setPerfil(perfilSalvo);
    setCarregado(true);
  }, [router]);

  useEffect(() => {
    if (!carregado || !usuario) return;
    buscarCompromissosMes();
  }, [carregado, usuario, mesAtual]);

  async function buscarCompromissosMes() {
    setErro("");

    const inicio = obterPrimeiroDiaMes(mesAtual);
    const fim = obterUltimoDiaMes(mesAtual);

    const { data, error } = await supabase
      .from("crm_agenda")
      .select("*")
      .eq("responsavel", usuario)
      .gte("data_compromisso", formatarDataISO(inicio))
      .lte("data_compromisso", formatarDataISO(fim))
      .order("data_compromisso", { ascending: true })
      .order("hora_compromisso", { ascending: true });

    if (error) {
      console.error(error);
      setErro("Erro ao carregar agenda.");
      setItens([]);
      return;
    }

    setItens((data as AgendaItem[]) || []);
  }

  function limparFormulario() {
    setEditandoId(null);
    setTitulo("");
    setDescricao("");
    setCategoria("compromisso");
    setLocal("");
    setDataCompromisso(diaSelecionado || formatarDataISO(new Date()));
    setHoraCompromisso("");
    setPrioridade("normal");
    setStatus("pendente");
    setObservacoes("");
  }

  async function salvarCompromisso(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (!titulo.trim() || !dataCompromisso) {
      setErro("Preencha pelo menos título e data.");
      return;
    }

    setSalvando(true);

    const payload = {
      criado_por: usuario,
      responsavel: usuario,
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      categoria,
      local: local.trim() || null,
      data_compromisso: dataCompromisso,
      hora_compromisso: horaCompromisso || null,
      prioridade,
      status,
      observacoes: observacoes.trim() || null,
    };

    let error = null;

    if (editandoId) {
      const resultado = await supabase
        .from("crm_agenda")
        .update(payload)
        .eq("id", editandoId);
      error = resultado.error;
    } else {
      const resultado = await supabase.from("crm_agenda").insert([payload]);
      error = resultado.error;
    }

    setSalvando(false);

    if (error) {
      console.error(error);
      setErro("Erro ao salvar compromisso.");
      return;
    }

    await buscarCompromissosMes();
    limparFormulario();
  }

  function carregarParaEdicao(item: AgendaItem) {
    setEditandoId(item.id);
    setTitulo(item.titulo || "");
    setDescricao(item.descricao || "");
    setCategoria(item.categoria || "compromisso");
    setLocal(item.local || "");
    setDataCompromisso(item.data_compromisso);
    setHoraCompromisso(formatarHora(item.hora_compromisso));
    setPrioridade(item.prioridade || "normal");
    setStatus(item.status || "pendente");
    setObservacoes(item.observacoes || "");
    setDiaSelecionado(item.data_compromisso);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function atualizarStatus(id: number, novoStatus: string) {
    const { error } = await supabase
      .from("crm_agenda")
      .update({ status: novoStatus })
      .eq("id", id);

    if (error) {
      console.error(error);
      setErro("Erro ao atualizar status.");
      return;
    }

    buscarCompromissosMes();
  }

  async function excluirCompromisso(id: number) {
    const confirmou = window.confirm("Deseja realmente excluir este compromisso?");
    if (!confirmou) return;

    const { error } = await supabase.from("crm_agenda").delete().eq("id", id);

    if (error) {
      console.error(error);
      setErro("Erro ao excluir compromisso.");
      return;
    }

    buscarCompromissosMes();
  }

  const gradeMes = useMemo(() => montarGradeMes(mesAtual), [mesAtual]);

  const compromissosPorDia = useMemo(() => {
    const mapa: Record<string, AgendaItem[]> = {};

    for (const item of itens) {
      if (!mapa[item.data_compromisso]) {
        mapa[item.data_compromisso] = [];
      }
      mapa[item.data_compromisso].push(item);
    }

    return mapa;
  }, [itens]);

  const compromissosDiaSelecionado = useMemo(() => {
    return (compromissosPorDia[diaSelecionado] || []).sort((a, b) => {
      const horaA = a.hora_compromisso || "99:99:99";
      const horaB = b.hora_compromisso || "99:99:99";
      return horaA.localeCompare(horaB);
    });
  }, [compromissosPorDia, diaSelecionado]);

  const hoje = formatarDataISO(new Date());

  if (!carregado) return null;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="mb-8 rounded-3xl bg-slate-900 px-6 py-8 text-white shadow-xl md:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-300">
            Agenda
          </p>

          <h1 className="mt-3 text-3xl font-bold md:text-5xl">
            Minha Agenda
          </h1>

          <p className="mt-4 text-sm text-slate-200 md:text-base">
            Calendário mensal de compromissos, visitas e atividades futuras.
          </p>

          <p className="mt-4 text-sm text-slate-300">
            Usuário logado: <strong>{nome || usuario || "Usuário"}</strong>
            {perfil ? <> • Perfil: <strong>{perfil}</strong></> : null}
          </p>
        </section>

        <section className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {MESES[mesAtual.getMonth()]} de {mesAtual.getFullYear()}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Clique em um dia para ver e gerenciar compromissos.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() =>
                  setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1, 1))
                }
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Mês anterior
              </button>

              <button
                onClick={() => {
                  const agora = new Date();
                  setMesAtual(new Date(agora.getFullYear(), agora.getMonth(), 1));
                  setDiaSelecionado(formatarDataISO(agora));
                  setDataCompromisso(formatarDataISO(agora));
                }}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Hoje
              </button>

              <button
                onClick={() =>
                  setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1))
                }
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Próximo mês
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-7 gap-2">
            {DIAS_SEMANA.map((dia) => (
              <div
                key={dia}
                className="rounded-xl bg-slate-100 px-2 py-3 text-center text-sm font-bold text-slate-700"
              >
                {dia}
              </div>
            ))}

            {gradeMes.map((dia) => {
              const dataIso = formatarDataISO(dia);
              const compromissosDia = compromissosPorDia[dataIso] || [];
              const ehHoje = dataIso === hoje;
              const ehSelecionado = dataIso === diaSelecionado;
              const ehOutroMes = dia.getMonth() !== mesAtual.getMonth();

              return (
                <button
                  key={dataIso}
                  onClick={() => {
                    setDiaSelecionado(dataIso);
                    setDataCompromisso(dataIso);
                  }}
                  className={`min-h-[110px] rounded-2xl border p-3 text-left transition ${
                    ehSelecionado
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  } ${ehOutroMes ? "opacity-40" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold ${ehSelecionado ? "text-white" : "text-slate-900"}`}>
                      {dia.getDate()}
                    </span>

                    {ehHoje ? (
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                          ehSelecionado
                            ? "bg-amber-300 text-slate-900"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        Hoje
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 space-y-1">
                    {compromissosDia.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className={`truncate rounded-lg px-2 py-1 text-[11px] font-medium ${
                          ehSelecionado
                            ? "bg-white/10 text-white"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {formatarHora(item.hora_compromisso) ? `${formatarHora(item.hora_compromisso)} • ` : ""}
                        {item.titulo}
                      </div>
                    ))}

                    {compromissosDia.length > 3 ? (
                      <div
                        className={`text-[11px] font-semibold ${
                          ehSelecionado ? "text-amber-300" : "text-amber-700"
                        }`}
                      >
                        +{compromissosDia.length - 3} compromisso(s)
                      </div>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            {editandoId ? "Editar compromisso" : "Novo compromisso"}
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Data selecionada: <strong>{dataCompromisso}</strong>
          </p>

          <form onSubmit={salvarCompromisso} className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Título
              </label>
              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                placeholder="Ex.: visita ao cliente, reunião, lembrete"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Descrição
              </label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="min-h-[110px] w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                placeholder="Detalhes do compromisso"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Categoria
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
              >
                <option value="compromisso">Compromisso</option>
                <option value="visita">Visita</option>
                <option value="ligacao">Ligação</option>
                <option value="reuniao">Reunião</option>
                <option value="lembrete">Lembrete</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Local
              </label>
              <input
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                placeholder="Ex.: escritório, cliente, obra"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Data
              </label>
              <input
                type="date"
                value={dataCompromisso}
                onChange={(e) => setDataCompromisso(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Hora
              </label>
              <input
                type="time"
                value={horaCompromisso}
                onChange={(e) => setHoraCompromisso(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Prioridade
              </label>
              <select
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
              >
                <option value="baixa">Baixa</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
              >
                <option value="pendente">Pendente</option>
                <option value="confirmado">Confirmado</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Observações
              </label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="min-h-[100px] w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                placeholder="Observações adicionais"
              />
            </div>

            {erro ? (
              <p className="md:col-span-2 text-sm font-medium text-red-600">
                {erro}
              </p>
            ) : null}

            <div className="md:col-span-2 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={salvando}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-70"
              >
                {salvando ? "Salvando..." : editandoId ? "Salvar edição" : "Salvar compromisso"}
              </button>

              <button
                type="button"
                onClick={limparFormulario}
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Limpar
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Compromissos do dia {diaSelecionado}
          </h2>

          <div className="mt-6 space-y-4">
            {compromissosDiaSelecionado.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                Nenhum compromisso neste dia.
              </div>
            ) : (
              compromissosDiaSelecionado.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 p-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                        {item.categoria}
                      </p>

                      <h3 className="mt-2 text-lg font-bold text-slate-900">
                        {item.titulo}
                      </h3>

                      <p className="mt-2 text-sm text-slate-600">
                        Data: <strong>{item.data_compromisso}</strong>
                        {item.hora_compromisso ? <> • Hora: <strong>{formatarHora(item.hora_compromisso)}</strong></> : null}
                        {item.local ? <> • Local: <strong>{item.local}</strong></> : null}
                      </p>

                      <p className="mt-2 text-sm text-slate-600">
                        Prioridade: <strong>{item.prioridade}</strong> • Status: <strong>{item.status}</strong>
                      </p>

                      {item.descricao ? (
                        <p className="mt-3 text-sm leading-6 text-slate-700">
                          {item.descricao}
                        </p>
                      ) : null}

                      {item.observacoes ? (
                        <p className="mt-3 text-sm leading-6 text-slate-500">
                          Observações: {item.observacoes}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => carregarParaEdicao(item)}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => atualizarStatus(item.id, "confirmado")}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Confirmar
                      </button>

                      <button
                        onClick={() => atualizarStatus(item.id, "concluido")}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Concluir
                      </button>

                      <button
                        onClick={() => atualizarStatus(item.id, "cancelado")}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Cancelar
                      </button>

                      <button
                        onClick={() => excluirCompromisso(item.id)}
                        className="rounded-xl border border-red-300 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}