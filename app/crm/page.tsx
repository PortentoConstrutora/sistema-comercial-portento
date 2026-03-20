// app/crm/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Lead = {
  id: number;
  nome: string;
  telefone?: string;
  campanha?: string | null;
  empreendimento?: string | null;
  data_chegada?: string;
  gestor?: string | null;
  status_lead?: string;
  primeiro_contato?: boolean;
};

function formatarData(data?: string) {
  if (!data) return "-";

  try {
    return new Date(data).toLocaleString("pt-BR");
  } catch {
    return "-";
  }
}

export default function MeusLeadsNovosPage() {
  const [usuario, setUsuario] = useState("sistema");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const [concluirId, setConcluirId] = useState<number | null>(null);
  const [contatoSucesso, setContatoSucesso] = useState(true);
  const [criarRetorno, setCriarRetorno] = useState(true);
  const [diasRetorno, setDiasRetorno] = useState(2);
  const [dataRetorno, setDataRetorno] = useState("");
  const [observacao, setObservacao] = useState("");
  const [proximaAcao, setProximaAcao] = useState("Fazer retorno");
  const [proximaAcaoCustom, setProximaAcaoCustom] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const usuarioSalvo = localStorage.getItem("portento_usuario") || "sistema";
    setUsuario(usuarioSalvo);
  }, []);

  useEffect(() => {
    void fetchLeads();
  }, []);

  async function fetchLeads() {
    setLoading(true);

    try {
      const res = await fetch("/api/leads/novos");

      if (!res.ok) {
        console.error("Erro ao buscar leads:", await res.text());
        setLeads([]);
        return;
      }

      const data = (await res.json()) as Lead[];
      setLeads(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro fetchLeads:", err);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }

  function resetarModal() {
    setConcluirId(null);
    setContatoSucesso(true);
    setCriarRetorno(true);
    setDiasRetorno(2);
    setDataRetorno("");
    setObservacao("");
    setProximaAcao("Fazer retorno");
    setProximaAcaoCustom("");
  }

  async function handleConcluirConfirm() {
    if (!concluirId) return;

    try {
      const payload = {
        contatoSucesso,
        observacao,
        criarRetorno,
        diasRetorno,
        dataRetorno,
        proximaAcao:
          proximaAcao === "Outra" ? proximaAcaoCustom.trim() : proximaAcao,
      };

      const res = await fetch(`/api/leads/${concluirId}/concluir`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-usuario": usuario,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        console.error("Erro na API:", json);
        alert("Erro ao concluir lead: " + (json.error || "Erro desconhecido"));
        return;
      }

      setLeads((prev) => prev.filter((lead) => lead.id !== concluirId));
      resetarModal();

      alert(
        "Contato concluído com sucesso." +
          (json.tarefa ? " Tarefa criada." : "")
      );
    } catch (err) {
      console.error(err);
      alert("Erro ao executar requisição.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="mb-6 rounded-3xl bg-slate-900 px-6 py-8 text-white shadow-xl md:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-300">
            CRM
          </p>
          <h1 className="mt-3 text-3xl font-bold md:text-5xl">Leads novos</h1>
          <p className="mt-4 text-sm text-slate-200 md:text-base">
            Esta é a página principal de primeiro contato. Todo novo lead deve
            entrar por aqui antes de seguir para tarefas e acompanhamento.
          </p>
        </section>

        <section className="mb-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
              CRM
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              Todos os leads
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Veja status, etapa do funil, origem, campanha e andamento
              comercial de toda a base.
            </p>

            <div className="mt-5">
              <Link
                href="/crm/todos-leads"
                className="inline-block rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Ver todos os leads
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
              CRM
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              Tarefas CRM
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Acompanhe retornos, pendências e próximas ações ligadas aos leads.
            </p>

            <div className="mt-5">
              <Link
                href="/tarefas-crm"
                className="inline-block rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Abrir tarefas do CRM
              </Link>
            </div>
          </div>
        </section>

        <div className="mb-6">
          <Link
            href="/crm/novo"
            className="inline-block rounded-xl bg-amber-400 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-amber-300"
          >
            Novo lead
          </Link>
        </div>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          {loading ? (
            <p className="text-slate-600">Carregando leads...</p>
          ) : leads.length === 0 ? (
            <p className="text-slate-600">Nenhum lead novo no momento.</p>
          ) : (
            <div className="overflow-auto">
              <table className="w-full min-w-[900px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="px-3 py-3 text-sm font-bold text-slate-700">
                      Nome
                    </th>
                    <th className="px-3 py-3 text-sm font-bold text-slate-700">
                      Telefone
                    </th>
                    <th className="px-3 py-3 text-sm font-bold text-slate-700">
                      Data chegada
                    </th>
                    <th className="px-3 py-3 text-sm font-bold text-slate-700">
                      Campanha
                    </th>
                    <th className="px-3 py-3 text-sm font-bold text-slate-700">
                      Ação
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b border-slate-100 bg-white"
                    >
                      <td className="px-3 py-3 text-sm font-medium text-slate-800">
                        {lead.nome}
                      </td>
                      <td className="px-3 py-3 text-sm text-slate-700">
                        {lead.telefone ?? "-"}
                      </td>
                      <td className="px-3 py-3 text-sm text-slate-700">
                        {formatarData(lead.data_chegada)}
                      </td>
                      <td className="px-3 py-3 text-sm text-slate-700">
                        {lead.campanha ?? lead.empreendimento ?? "-"}
                      </td>
                      <td className="px-3 py-3 text-sm">
                        <button
                          onClick={() => setConcluirId(lead.id)}
                          className="rounded-xl bg-amber-400 px-3 py-2 text-xs font-semibold text-slate-900 transition hover:bg-amber-300"
                          type="button"
                        >
                          Concluir contato
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {concluirId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold">Concluir contato</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Resultado do contato
                </label>

                <div className="mt-2 flex gap-4">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="resultado"
                      checked={contatoSucesso}
                      onChange={() => setContatoSucesso(true)}
                    />
                    <span>Entrei em contato</span>
                  </label>

                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="resultado"
                      checked={!contatoSucesso}
                      onChange={() => setContatoSucesso(false)}
                    />
                    <span>Tentei entrar em contato</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Observação (opcional)
                </label>

                <textarea
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Próxima ação
                </label>

                <select
                  value={proximaAcao}
                  onChange={(e) => setProximaAcao(e.target.value)}
                  className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                >
                  <option value="Fazer retorno">Fazer retorno</option>
                  <option value="Nova tentativa de contato">
                    Nova tentativa de contato
                  </option>
                  <option value="Agendar visita">Agendar visita</option>
                  <option value="Enviar proposta">Enviar proposta</option>
                  <option value="Aguardar cliente">Aguardar cliente</option>
                  <option value="Outra">Outra</option>
                </select>

                {proximaAcao === "Outra" && (
                  <input
                    type="text"
                    value={proximaAcaoCustom}
                    onChange={(e) => setProximaAcaoCustom(e.target.value)}
                    placeholder="Digite a próxima ação"
                    className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                  />
                )}
              </div>

              <div>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={criarRetorno}
                    onChange={(e) => setCriarRetorno(e.target.checked)}
                  />
                  <span className="text-sm">Criar tarefa de retorno</span>
                </label>

                {criarRetorno && (
                  <div className="mt-2 flex items-center gap-3">
                    <label className="text-sm text-slate-700">
                      Data do retorno:
                    </label>

                    <input
                      type="date"
                      className="rounded border px-2 py-1"
                      value={dataRetorno}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => {
                        const value = e.target.value;
                        setDataRetorno(value);

                        if (!value) return;

                        const hoje = new Date();
                        hoje.setHours(0, 0, 0, 0);

                        const escolhida = new Date(`${value}T00:00:00`);
                        const diffMs = escolhida.getTime() - hoje.getTime();
                        const diffDias = Math.ceil(
                          diffMs / (1000 * 60 * 60 * 24)
                        );

                        setDiasRetorno(diffDias > 0 ? diffDias : 1);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={resetarModal}
                className="rounded-lg border px-4 py-2"
                type="button"
              >
                Cancelar
              </button>

              <button
                onClick={() => void handleConcluirConfirm()}
                className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
                type="button"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
