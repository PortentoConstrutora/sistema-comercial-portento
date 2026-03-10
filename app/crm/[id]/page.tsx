"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

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
  observacoes: string | null;
};

export default function LeadDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    async function carregarLead() {
      const logado = localStorage.getItem("portento_logado");
      if (logado !== "sim") {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("crm_leads")
        .select("*")
        .eq("id", Number(params.id))
        .single();

      if (error) {
        console.error(error);
        setCarregando(false);
        return;
      }

      setLead(data);
      setCarregando(false);
    }

    carregarLead();
  }, [params.id, router]);

  async function salvarLead() {
    if (!lead) return;

    setSalvando(true);
    setMensagem("");

    const { error } = await supabase
      .from("crm_leads")
      .update({
        status_lead: lead.status_lead,
        etapa_funil: lead.etapa_funil,
        proxima_acao: lead.proxima_acao,
        observacoes: lead.observacoes,
        ultima_atualizacao: new Date().toISOString(),
      })
      .eq("id", lead.id);

    if (error) {
      console.error(error);
      setMensagem("Erro ao salvar alterações.");
      setSalvando(false);
      return;
    }

    setMensagem("Alterações salvas com sucesso.");
    setSalvando(false);
  }

  if (carregando) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-slate-600">Carregando lead...</p>
        </div>
      </main>
    );
  }

  if (!lead) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-slate-600">Lead não encontrado.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-5xl">
        <section className="mb-6 rounded-3xl bg-slate-900 px-6 py-8 text-white shadow-xl md:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-300">
            Detalhe do Lead
          </p>

          <h1 className="mt-3 text-3xl font-bold md:text-5xl">{lead.nome}</h1>

          <p className="mt-4 text-sm text-slate-200 md:text-base">
            Aqui o gestor vai acompanhar e atualizar o lead.
          </p>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Nome
              </label>
              <input
                value={lead.nome || ""}
                disabled
                className="w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Telefone
              </label>
              <input
                value={lead.telefone || ""}
                disabled
                className="w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Empreendimento
              </label>
              <input
                value={lead.empreendimento || ""}
                disabled
                className="w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Origem
              </label>
              <input
                value={lead.origem || ""}
                disabled
                className="w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Status do lead
              </label>
              <select
                value={lead.status_lead || ""}
                onChange={(e) =>
                  setLead({ ...lead, status_lead: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
              >
                <option value="Novo">Novo</option>
                <option value="Em andamento">Em andamento</option>
                <option value="Agendado">Agendado</option>
                <option value="Fechado">Fechado</option>
                <option value="Perdido">Perdido</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Etapa do funil
              </label>
              <select
                value={lead.etapa_funil || ""}
                onChange={(e) =>
                  setLead({ ...lead, etapa_funil: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
              >
                <option value="Lead Novo">Lead Novo</option>
                <option value="Primeiro Contato">Primeiro Contato</option>
                <option value="Agendado">Agendado</option>
                <option value="Visitou">Visitou</option>
                <option value="Fechado">Fechado</option>
                <option value="Perdido">Perdido</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Próxima ação
              </label>
              <input
                value={lead.proxima_acao || ""}
                onChange={(e) =>
                  setLead({ ...lead, proxima_acao: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Observações
              </label>
              <textarea
                value={lead.observacoes || ""}
                onChange={(e) =>
                  setLead({ ...lead, observacoes: e.target.value })
                }
                rows={5}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
              />
            </div>
          </div>

          {mensagem ? (
            <p className="mt-4 text-sm font-medium text-slate-700">{mensagem}</p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={salvarLead}
              disabled={salvando}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-70"
            >
              {salvando ? "Salvando..." : "Salvar alterações"}
            </button>

            <button
              onClick={() => router.push("/crm")}
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Voltar
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}