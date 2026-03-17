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
};

export default function TarefasCrmPage() {
  const router = useRouter();
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [perfil, setPerfil] = useState("");
  const [usuarioLogado, setUsuarioLogado] = useState("");
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState("todos");
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

    setTarefas(data || []);
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

 function abrirModalConclusao(tarefa: Tarefa) {
  setModalTarefaId(tarefa.id);
  setModalTarefaTipo(tarefa.tipo);

  if (tarefa.tipo === "Primeiro contato") {
    setModalResultado("Consegui falar com o cliente");
    setModalProximaAcao("Fazer retorno");
    setModalNovoTipoTarefa("Retorno");
  } else if (tarefa.tipo === "Retorno") {
    setModalResultado("Cliente pediu retorno");
    setModalProximaAcao("Fazer retorno");
    setModalNovoTipoTarefa("Retorno");
 } else if (tarefa.tipo === "Confirmar visita") {
  setModalResultado("Cliente quer visita");
  setModalProximaAcao("Confirmar visita");
  setModalNovoTipoTarefa("Confirmar visita");
} else {
    setModalResultado("Consegui falar com o cliente");
    setModalProximaAcao("Fazer retorno");
    setModalNovoTipoTarefa("Retorno");
  }

  setModalProximaAcaoCustom("");
  setModalObservacao("");
  setModalCriarNovaTarefa(true);
  setModalNovaDataTarefa("");
}

async function concluirTarefa() {
  if (!modalTarefaId) return;

  setSalvandoId(modalTarefaId);

  const tarefaAtual = tarefas.find((t) => t.id === modalTarefaId);
  const usuarioAtual = localStorage.getItem("portento_usuario") || "";

  if (!tarefaAtual) {
    alert("Tarefa não encontrada.");
    setSalvandoId(null);
    return;
  }

  const proximaAcaoFinal =
    modalProximaAcao === "Outra"
      ? modalProximaAcaoCustom.trim()
      : modalProximaAcao;

  if (!proximaAcaoFinal) {
    alert("Preencha a próxima ação.");
    setSalvandoId(null);
    return;
  }

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

    const descricaoHistorico = `Tarefa "${tarefaAtual.tipo}" concluída com resultado "${modalResultado}". Lead atualizado para status "${novoStatusLead}", etapa "${novaEtapaFunil}" e próxima ação "${proximaAcaoFinal}". ${
      modalObservacao ? `Observação: ${modalObservacao}` : ""
    }`;

    const { error: historicoError } = await supabase
      .from("crm_historico")
      .insert({
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

    if (modalCriarNovaTarefa) {
      if (!modalNovaDataTarefa) {
        alert("Escolha a data da nova tarefa.");
        setSalvandoId(null);
        return;
      }

      const prazoNovaTarefa = new Date(`${modalNovaDataTarefa}T09:00:00`).toISOString();

      const { error: novaTarefaError } = await supabase
        .from("crm_tarefas")
        .insert({
          lead_id: tarefaAtual.lead_id,
          tipo: modalNovoTipoTarefa,
          status: "Pendente",
          prazo: prazoNovaTarefa,
          observacao: `Nova tarefa criada após conclusão de "${tarefaAtual.tipo}". ${
            modalObservacao ? modalObservacao : ""
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

  await carregarTarefas();

  setModalTarefaId(null);
  setModalTarefaTipo("");
  setModalResultado("Consegui falar com o cliente");
  setModalProximaAcao("Fazer retorno");
  setModalProximaAcaoCustom("");
  setModalObservacao("");
  setModalCriarNovaTarefa(true);
  setModalNovoTipoTarefa("Retorno");
  setModalNovaDataTarefa("");

  setSalvandoId(null);
}

  const tarefasFiltradas = useMemo(() => {
    return tarefas.filter((tarefa) => {
      const statusVisual = getStatusVisual(tarefa);

      const matchStatus =
        filtroStatus === "todos" ||
        statusVisual.toLowerCase() === filtroStatus.toLowerCase();

      if (perfil === "gestor") {
        return (
          matchStatus &&
          (tarefa.gestor || "").toLowerCase() === usuarioLogado
        );
      }

      return matchStatus;
    });
  }, [tarefas, filtroStatus, perfil, usuarioLogado]);

  const total = tarefasFiltradas.length;
  const pendentes = tarefasFiltradas.filter(
    (t) => getStatusVisual(t) === "Pendente"
  ).length;
  const atrasadas = tarefasFiltradas.filter(
    (t) => getStatusVisual(t) === "Atrasada"
  ).length;
  const concluidas = tarefasFiltradas.filter(
    (t) => getStatusVisual(t) === "Concluída"
  ).length;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="mb-8 rounded-3xl bg-slate-900 px-6 py-8 text-white shadow-xl md:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-300">
            CRM
          </p>

          <h1 className="mt-3 text-3xl font-bold md:text-5xl">
            Tarefas CRM
          </h1>

          <p className="mt-4 text-sm text-slate-200 md:text-base">
            Pendências, retornos, prazos e próximas ações ligadas aos leads do CRM.
          </p>

          <p className="mt-4 text-sm text-slate-300">
            Usuário logado: <strong>{nomeUsuario || "Carregando..."}</strong>
          </p>
        </section>

        <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total de tarefas</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">{total}</h2>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Pendentes</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">{pendentes}</h2>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Atrasadas</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">{atrasadas}</h2>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Concluídas</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">{concluidas}</h2>
          </div>
        </section>

        <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Filtrar por status
          </label>

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none md:max-w-sm"
          >
            <option value="todos">Todos</option>
            <option value="pendente">Pendente</option>
            <option value="atrasada">Atrasada</option>
            <option value="concluída">Concluída</option>
          </select>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          {carregando ? (
            <p className="text-slate-600">Carregando tarefas...</p>
          ) : (
            <div className="overflow-auto">
              <table className="w-full min-w-[1050px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="px-3 py-3 text-sm font-bold text-slate-700">Tipo</th>
                    <th className="px-3 py-3 text-sm font-bold text-slate-700">Lead ID</th>
                    <th className="px-3 py-3 text-sm font-bold text-slate-700">Status</th>
                    <th className="px-3 py-3 text-sm font-bold text-slate-700">Prazo</th>
                    <th className="px-3 py-3 text-sm font-bold text-slate-700">Observação</th>
                    <th className="px-3 py-3 text-sm font-bold text-slate-700">Gestor</th>
                    <th className="px-3 py-3 text-sm font-bold text-slate-700">Ação</th>
                  </tr>
                </thead>

                <tbody>
                  {tarefasFiltradas.map((tarefa) => {
                    const statusVisual = getStatusVisual(tarefa);
                    const concluida = statusVisual === "Concluída";

                    return (
                      <tr key={tarefa.id} className="border-b border-slate-100">
                        <td className="px-3 py-3 text-sm text-slate-700">{tarefa.tipo}</td>
                        <td className="px-3 py-3 text-sm text-slate-700">{tarefa.lead_id ?? "-"}</td>
                        <td className="px-3 py-3 text-sm text-slate-700">{statusVisual}</td>
                        <td className="px-3 py-3 text-sm text-slate-700">
                          {tarefa.prazo
                            ? new Date(tarefa.prazo).toLocaleString("pt-BR")
                            : "-"}
                        </td>
                        <td className="px-3 py-3 text-sm text-slate-700">{tarefa.observacao || "-"}</td>
                        <td className="px-3 py-3 text-sm text-slate-700">{tarefa.gestor || "-"}</td>
                        <td className="px-3 py-3 text-sm">
                          {concluida ? (
                            <span className="text-xs font-semibold text-green-700">
                              Concluída
                            </span>
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
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
      <h2 className="mb-2 text-xl font-bold text-slate-900">
        Concluir tarefa
      </h2>

      <p className="text-sm text-slate-600">
        Tarefa selecionada: <strong>{modalTarefaTipo}</strong>
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Resultado da tarefa
          </label>
       <select
  value={modalResultado}
  onChange={(e) => {
    const resultado = e.target.value;
    setModalResultado(resultado);

    if (resultado === "Consegui falar com o cliente") {
      setModalProximaAcao("Fazer retorno");
      setModalNovoTipoTarefa("Retorno");
      setModalCriarNovaTarefa(true);
    }

    if (resultado === "Tentei e não consegui") {
      setModalProximaAcao("Nova tentativa de contato");
      setModalNovoTipoTarefa("Nova tentativa");
      setModalCriarNovaTarefa(true);
    }

    if (resultado === "Cliente pediu retorno") {
      setModalProximaAcao("Fazer retorno");
      setModalNovoTipoTarefa("Retorno");
      setModalCriarNovaTarefa(true);
    }

    if (resultado === "Cliente quer visita") {
      setModalProximaAcao("Confirmar visita");
      setModalNovoTipoTarefa("Confirmar visita");
      setModalCriarNovaTarefa(true);
    }

    if (resultado === "Cliente pediu proposta") {
      setModalProximaAcao("Enviar proposta");
      setModalNovoTipoTarefa("Enviar proposta");
      setModalCriarNovaTarefa(true);
    }

    if (resultado === "Cliente sem interesse") {
      setModalProximaAcao("Encerrar lead");
      setModalNovoTipoTarefa("Retorno");
      setModalCriarNovaTarefa(false);
    }
  }}
  className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
>
            <option value="Consegui falar com o cliente">
              Consegui falar com o cliente
            </option>
            <option value="Tentei e não consegui">
              Tentei e não consegui
            </option>
            <option value="Cliente pediu retorno">
              Cliente pediu retorno
            </option>
            <option value="Cliente quer visita">
              Cliente quer visita
            </option>
            <option value="Cliente pediu proposta">
              Cliente pediu proposta
            </option>
            <option value="Cliente sem interesse">
              Cliente sem interesse
            </option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Observação
          </label>
          <textarea
            value={modalObservacao}
            onChange={(e) => setModalObservacao(e.target.value)}
            rows={4}
            className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="Digite uma observação sobre o andamento"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Próxima ação
          </label>
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
              Criar nova tarefa para a próxima ação
            </span>
          </label>

          {modalCriarNovaTarefa && (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Tipo da próxima tarefa
                </label>
                <select
                  value={modalNovoTipoTarefa}
                  onChange={(e) => setModalNovoTipoTarefa(e.target.value)}
                  className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                >
                  <option value="Retorno">Retorno</option>
                  <option value="Nova tentativa">Nova tentativa</option>
                  <option value="Confirmar visita">Confirmar visita</option>
                  <option value="Visita">Visita</option>
                  <option value="Enviar proposta">Enviar proposta</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Data da próxima tarefa
                </label>
                <input
                  type="date"
                  value={modalNovaDataTarefa}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setModalNovaDataTarefa(e.target.value)}
                  className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={() => {
            setModalTarefaId(null);
            setModalTarefaTipo("");
            setModalResultado("Consegui falar com o cliente");
            setModalProximaAcao("Fazer retorno");
            setModalProximaAcaoCustom("");
            setModalObservacao("");
            setModalCriarNovaTarefa(true);
            setModalNovoTipoTarefa("Retorno");
            setModalNovaDataTarefa("");
          }}
          className="rounded-lg border px-4 py-2"
        >
          Cancelar
        </button>

        <button
  onClick={concluirTarefa}
  className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
>
  {salvandoId === modalTarefaId ? "Salvando..." : "Continuar"}
</button>
      </div>
    </div>
  </div>
)}
    </main>
  );
}