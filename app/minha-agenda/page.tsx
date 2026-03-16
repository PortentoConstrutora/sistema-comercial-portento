"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type AgendaItem = {
  id: number;
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
  criado_por: string | null;
};

export default function MinhaAgendaPage() {
  const router = useRouter();

  const [carregado, setCarregado] = useState(false);
  const [usuario, setUsuario] = useState("");
  const [nome, setNome] = useState("");
  const [perfil, setPerfil] = useState("");

  const [itens, setItens] = useState<AgendaItem[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("compromisso");
  const [local, setLocal] = useState("");
  const [dataCompromisso, setDataCompromisso] = useState("");
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
    buscarAgenda();
  }, [carregado, usuario]);

  async function buscarAgenda() {
    setErro("");

    const { data, error } = await supabase
      .from("crm_agenda")
      .select("*")
      .eq("responsavel", usuario)
      .order("data_compromisso", { ascending: true })
      .order("hora_compromisso", { ascending: true });

    if (error) {
      setErro("Erro ao carregar agenda.");
      return;
    }

    setItens((data as AgendaItem[]) || []);
  }

  async function criarCompromisso(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (!titulo.trim() || !dataCompromisso) {
      setErro("Preencha pelo menos título e data.");
      return;
    }

    setSalvando(true);

    const { error } = await supabase.from("crm_agenda").insert([
      {
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
      },
    ]);

    setSalvando(false);

    if (error) {
      setErro("Erro ao salvar compromisso.");
      return;
    }

    setTitulo("");
    setDescricao("");
    setCategoria("compromisso");
    setLocal("");
    setDataCompromisso("");
    setHoraCompromisso("");
    setPrioridade("normal");
    setStatus("pendente");
    setObservacoes("");

    buscarAgenda();
  }

  async function atualizarStatus(id: number, novoStatus: string) {
    const { error } = await supabase
      .from("crm_agenda")
      .update({ status: novoStatus })
      .eq("id", id);

    if (error) {
      setErro("Erro ao atualizar status.");
      return;
    }

    buscarAgenda();
  }

  const itensOrdenados = useMemo(() => {
    return [...itens];
  }, [itens]);

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
            Compromissos, visitas e atividades futuras do usuário logado.
          </p>

          <p className="mt-4 text-sm text-slate-300">
            Logado como <strong>{nome || usuario || "Usuário"}</strong>
            {perfil ? <> • Perfil: <strong>{perfil}</strong></> : null}
          </p>
        </section>

        <section className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Novo compromisso
          </h2>

          <form onSubmit={criarCompromisso} className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Título
              </label>
              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                placeholder="Ex.: visita ao cliente, reunião comercial, retorno importante"
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
                placeholder="Ex.: escritório, obra, cliente"
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

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={salvando}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-70"
              >
                {salvando ? "Salvando..." : "Salvar compromisso"}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Meus compromissos
          </h2>

          <div className="mt-6 space-y-4">
            {itensOrdenados.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                Nenhum compromisso cadastrado ainda.
              </div>
            ) : (
              itensOrdenados.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 p-5"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                        {item.categoria}
                      </p>

                      <h3 className="mt-2 text-lg font-bold text-slate-900">
                        {item.titulo}
                      </h3>

                      <p className="mt-2 text-sm text-slate-600">
                        Data: <strong>{item.data_compromisso}</strong>
                        {item.hora_compromisso ? <> • Hora: <strong>{item.hora_compromisso}</strong></> : null}
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