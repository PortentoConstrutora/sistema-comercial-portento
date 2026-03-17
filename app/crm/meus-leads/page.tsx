"use client";

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

export default function MeusLeadsNovos() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [concluirId, setConcluirId] = useState<number | null>(null);
  const [contatoSucesso, setContatoSucesso] = useState<boolean>(true);
  const [criarRetorno, setCriarRetorno] = useState<boolean>(true);
  const [diasRetorno, setDiasRetorno] = useState<number>(2);
  const [observacao, setObservacao] = useState<string>("");

  const usuario = (typeof window !== "undefined" && localStorage.getItem("portento_usuario")) || "sistema";

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    setLoading(true);
    try {
      const res = await fetch("/api/leads/novos");
      if (!res.ok) {
        console.error("Erro ao buscar leads:", await res.text());
        setLeads([]);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setLeads(data || []);
    } catch (err) {
      console.error("Erro fetchLeads:", err);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleConcluirConfirm() {
    if (!concluirId) return;
    try {
      const payload = {
        contatoSucesso,
        observacao,
        criarRetorno,
        diasRetorno,
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

      // Atualiza UI: remover lead concluído da lista
      setLeads((prev) => prev.filter((l) => l.id !== concluirId));
      // Fechar modal e resetar
      setConcluirId(null);
      setContatoSucesso(true);
      setCriarRetorno(true);
      setDiasRetorno(2);
      setObservacao("");
      alert("Contato concluído com sucesso." + (json.tarefa ? " Tarefa criada." : ""));
    } catch (err) {
      console.error(err);
      alert("Erro ao executar requisição.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="mb-6 rounded-3xl bg-slate-900 px-6 py-8 text-white shadow-xl md:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-300">CRM</p>
          <h1 className="mt-3 text-3xl font-bold md:text-5xl">Meus Leads — Novos</h1>
          <p className="mt-4 text-sm text-slate-200 md:text-base">
            Leads novos com prioridade de primeiro contato. Conclua o contato inicial aqui.
          </p>
        </section>

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
                    <th className="px-3 py-3 text-sm font-bold text-slate-700">Nome</th>
                    <th className="px-3 py-3 text-sm font-bold text-slate-700">Telefone</th>
                    <th className="px-3 py-3 text-sm font-bold text-slate-700">Data Chegada</th>
                    <th className="px-3 py-3 text-sm font-bold text-slate-700">Campanha</th>
                    <th className="px-3 py-3 text-sm font-bold text-slate-700">Ação</th>
                  </tr>
                </thead>

                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="border-b border-slate-100">
                      <td className="px-3 py-3 text-sm text-slate-700">{lead.nome}</td>
                      <td className="px-3 py-3 text-sm text-slate-700">{lead.telefone ?? "-"}</td>
                      <td className="px-3 py-3 text-sm text-slate-700">
                        {lead.data_chegada ? new Date(lead.data_chegada).toLocaleString("pt-BR") : "-"}
                      </td>
                      <td className="px-3 py-3 text-sm text-slate-700">{lead.campanha ?? lead.empreendimento ?? "-"}</td>
                      <td className="px-3 py-3 text-sm">
                        <button
                          onClick={() => setConcluirId(lead.id)}
                          className="rounded-xl bg-amber-400 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-amber-300"
                        >
                          Concluir (Entrei/Tentei)
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

      {/* Modal */}
      {concluirId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4">Concluir contato</h2>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">Resultado do contato</label>
                <div className="mt-2 flex gap-4">
                  <label className="inline-flex items-center gap-2">
                    <input type="radio" name="resultado" checked={contatoSucesso} onChange={() => setContatoSucesso(true)} />
                    <span>Entrei em contato</span>
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="radio" name="resultado" checked={!contatoSucesso} onChange={() => setContatoSucesso(false)} />
                    <span>Tentei entrar em contato</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Observação (opcional)</label>
                <textarea
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                  rows={3}
                />
              </div>

              <div>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={criarRetorno} onChange={(e) => setCriarRetorno(e.target.checked)} />
                  <span className="text-sm">Criar tarefa de retorno</span>
                </label>

                {criarRetorno && (
                  <div className="mt-2 flex items-center gap-3">
                    <label className="text-sm text-slate-700">Dias para retorno:</label>
                    <input
                      type="number"
                      min={1}
                      className="w-20 rounded border px-2 py-1"
                      value={diasRetorno}
                      onChange={(e) => setDiasRetorno(Number(e.target.value))}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setConcluirId(null)} className="px-4 py-2 rounded-lg border">
                Cancelar
              </button>
              <button
                onClick={handleConcluirConfirm}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
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