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

export default function AgendaPage() {
  const router = useRouter();
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [perfil, setPerfil] = useState("");
  const [usuarioLogado, setUsuarioLogado] = useState("");
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [salvandoId, setSalvandoId] = useState<number | null>(null);

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

async function concluirTarefa(id: number) {
  setSalvandoId(id);

  const tarefaAtual = tarefas.find((t) => t.id === id);
  const usuarioAtual = localStorage.getItem("portento_usuario") || "";

  if (!tarefaAtual) {
    alert("Tarefa não encontrada.");
    setSalvandoId(null);
    return;
  }

  const { error } = await supabase
    .from("crm_tarefas")
    .update({
      status: "Concluída",
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("Erro ao concluir tarefa.");
    setSalvandoId(null);
    return;
  }

  let descricaoHistorico = `Tarefa "${tarefaAtual.tipo}" concluída.`;

  if (tarefaAtual.lead_id) {
    let novoStatusLead = "Em andamento";
    let novaEtapaFunil = "Primeiro Contato";

    if (tarefaAtual.tipo === "Confirmar visita") {
      novoStatusLead = "Em andamento";
      novaEtapaFunil = "Agendado";
    }

    if (tarefaAtual.tipo === "Primeiro contato") {
      novoStatusLead = "Em andamento";
      novaEtapaFunil = "Primeiro Contato";
    }

    const { error: leadError } = await supabase
      .from("crm_leads")
      .update({
        status_lead: novoStatusLead,
        etapa_funil: novaEtapaFunil,
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

    descricaoHistorico += ` Lead atualizado para status "${novoStatusLead}" e etapa "${novaEtapaFunil}".`;
  }

  const { error: historicoError } = await supabase
    .from("crm_historico")
    .insert({
      lead_id: tarefaAtual.lead_id,
      tarefa_id: tarefaAtual.id,
      usuario: usuarioAtual,
      tipo_evento: "tarefa_concluida",
      descricao: descricaoHistorico,
    });

  if (historicoError) {
    console.error(historicoError);
    alert("A tarefa e o lead foram atualizados, mas deu erro ao gravar histórico.");
  }

  await carregarTarefas();
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
                              onClick={() => concluirTarefa(tarefa.id)}
                              disabled={salvandoId === tarefa.id}
                              className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-70"
                            >
                              {salvandoId === tarefa.id ? "Salvando..." : "Concluir"}
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
    </main>
  );
}