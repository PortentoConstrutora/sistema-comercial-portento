"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

type Lead = {
  id: number;
  id_lead: string | null;
  nome: string;
  telefone: string | null;
  empreendimento: string | null;
  origem: string | null;
  campanha: string | null;
  gestor: string | null;
  status_lead: string | null;
  etapa_funil: string | null;
  proxima_acao: string | null;
};

export default function TodosLeadsPage() {
  const router = useRouter();
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [perfil, setPerfil] = useState("");
  const [usuarioLogado, setUsuarioLogado] = useState("");
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [carregando, setCarregando] = useState(true);

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

  useEffect(() => {
    async function carregarLeads() {
      setCarregando(true);

      const { data, error } = await supabase
        .from("crm_leads")
        .select("*")
        .order("id", { ascending: false });

      if (error) {
        console.error(error);
        setLeads([]);
        setCarregando(false);
        return;
      }

      setLeads(data || []);
      setCarregando(false);
    }

    carregarLeads();
  }, []);

  const leadsFiltrados = useMemo(() => {
    return leads.filter((lead) => {
      const termo = busca.trim().toLowerCase();

      const matchBusca =
        lead.nome?.toLowerCase().includes(termo) ||
        (lead.telefone || "").toLowerCase().includes(termo) ||
        (lead.empreendimento || "").toLowerCase().includes(termo) ||
        (lead.origem || "").toLowerCase().includes(termo);

      const matchStatus =
        filtroStatus === "todos" ||
        (lead.status_lead || "").toLowerCase() === filtroStatus.toLowerCase();

      if (perfil === "gestor") {
        return (
          matchBusca &&
          matchStatus &&
          (lead.gestor || "").toLowerCase() === usuarioLogado
        );
      }

      return matchBusca && matchStatus;
    });
  }, [leads, busca, filtroStatus, perfil, usuarioLogado]);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="mb-8 rounded-3xl bg-slate-900 px-6 py-8 text-white shadow-xl md:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-300">
            CRM
          </p>

          <h1 className="mt-3 text-3xl font-bold md:text-5xl">
            Meus Leads
          </h1>

          <p className="mt-4 text-sm text-slate-200 md:text-base">
            Visualização geral dos leads com status, etapa do funil e acompanhamento comercial.
          </p>

          <p className="mt-4 text-sm text-slate-300">
            Usuário logado: <strong>{nomeUsuario || "Carregando..."}</strong>
          </p>
        </section>

        <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Buscar lead
              </label>
              <input
                type="text"
                placeholder="Nome, telefone, empreendimento ou origem"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Filtrar por status
              </label>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
              >
                <option value="todos">Todos</option>
                <option value="novo">Novo</option>
                <option value="em andamento">Em andamento</option>
                <option value="agendado">Agendado</option>
                <option value="perdido">Perdido</option>
              </select>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          {carregando ? (
            <p className="text-slate-600">Carregando leads...</p>
          ) : (
            <div className="overflow-auto">
              <table className="w-full min-w-[1100px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="px-3 py-3 text-sm font-bold text-slate-700">Nome</th>
                    <th className="px-3 py-3 text-sm font-bold text-slate-700">Telefone</th>
                    <th className="px-3 py-3 text-sm font-bold text-slate-700">Empreendimento</th>
                    <th className="px-3 py-3 text-sm font-bold text-slate-700">Origem</th>
                    <th className="px-3 py-3 text-sm font-bold text-slate-700">Campanha</th>
                    <th className="px-3 py-3 text-sm font-bold text-slate-700">Status</th>
                    <th className="px-3 py-3 text-sm font-bold text-slate-700">Etapa</th>
                    <th className="px-3 py-3 text-sm font-bold text-slate-700">Próxima ação</th>
                  <th className="px-3 py-3 text-sm font-bold text-slate-700">Ação</th>
                  </tr>
                </thead>

                <tbody>
                  {leadsFiltrados.map((lead) => (
                    <tr key={lead.id} className="border-b border-slate-100">
                      <td className="px-3 py-3 text-sm text-slate-700">{lead.nome}</td>
                      <td className="px-3 py-3 text-sm text-slate-700">{lead.telefone || "-"}</td>
                      <td className="px-3 py-3 text-sm text-slate-700">{lead.empreendimento || "-"}</td>
                      <td className="px-3 py-3 text-sm text-slate-700">{lead.origem || "-"}</td>
                      <td className="px-3 py-3 text-sm text-slate-700">{lead.campanha || "-"}</td>
                      <td className="px-3 py-3 text-sm text-slate-700">{lead.status_lead || "-"}</td>
                      <td className="px-3 py-3 text-sm text-slate-700">{lead.etapa_funil || "-"}</td>
                      <td className="px-3 py-3 text-sm text-slate-700">{lead.proxima_acao || "-"}</td>
                    <td className="px-3 py-3 text-sm">
  <button
    onClick={() => router.push(`/crm/historico/${lead.id}`)}
    className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
  >
    Ver histórico
  </button>
</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {leadsFiltrados.length === 0 ? (
                <div className="py-6 text-sm text-slate-500">
                  Nenhum lead encontrado com os filtros atuais.
                </div>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}