"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

type Lead = {
  id: number;
  nome: string;
  telefone: string | null;
  status_lead: string | null;
  etapa_funil: string | null;
};

type HistoricoItem = {
  id: number;
  lead_id: number | null;
  tarefa_id: number | null;
  tipo_evento: string | null;
  descricao: string | null;
  usuario: string | null;
  meta: any;
  created_at: string | null;
};

export default function HistoricoLeadPage() {
  const router = useRouter();
  const params = useParams();
  const leadId = Number(params?.id);

  const [nomeUsuario, setNomeUsuario] = useState("");
  const [lead, setLead] = useState<Lead | null>(null);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const logado = localStorage.getItem("portento_logado");
    const nome = localStorage.getItem("portento_nome");

    if (logado !== "sim") {
      router.push("/login");
      return;
    }

    setNomeUsuario(nome || "");
  }, [router]);

  useEffect(() => {
    async function carregarDados() {
      if (!leadId) return;

      setCarregando(true);

      const { data: leadData, error: leadError } = await supabase
        .from("crm_leads")
        .select("id, nome, telefone, status_lead, etapa_funil")
        .eq("id", leadId)
        .maybeSingle();

      if (leadError) {
        console.error(leadError);
        alert("Erro ao carregar lead.");
        setCarregando(false);
        return;
      }

      setLead(leadData || null);

      const { data: historicoData, error: historicoError } = await supabase
        .from("crm_historico")
        .select("id, lead_id, tarefa_id, tipo_evento, descricao, usuario, meta, created_at")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });

      if (historicoError) {
        console.error(historicoError);
        alert("Erro ao carregar histórico.");
        setHistorico([]);
        setCarregando(false);
        return;
      }

      setHistorico(historicoData || []);
      setCarregando(false);
    }

    carregarDados();
  }, [leadId]);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="mb-8 rounded-3xl bg-slate-900 px-6 py-8 text-white shadow-xl md:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-300">
            CRM
          </p>

          <h1 className="mt-3 text-3xl font-bold md:text-5xl">
            Histórico do Lead
          </h1>

          <p className="mt-4 text-sm text-slate-200 md:text-base">
            Veja tudo o que aconteceu com esse lead: criação, contatos, tarefas e atualizações.
          </p>

          <p className="mt-4 text-sm text-slate-300">
            Usuário logado: <strong>{nomeUsuario || "Carregando..."}</strong>
          </p>
        </section>

        <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {lead?.nome || "Lead"}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Telefone: {lead?.telefone || "-"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Status: {lead?.status_lead || "-"} | Etapa: {lead?.etapa_funil || "-"}
              </p>
            </div>

            <button
              onClick={() => router.push("/crm/todos-leads")}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Voltar para Meus Leads
            </button>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          {carregando ? (
            <p className="text-slate-600">Carregando histórico...</p>
          ) : historico.length === 0 ? (
            <p className="text-slate-600">Nenhum histórico encontrado para esse lead.</p>
          ) : (
            <div className="space-y-4">
              {historico.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {item.tipo_evento || "evento"}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {item.descricao || "-"}
                      </p>
                    </div>

                    <div className="text-right text-xs text-slate-500">
                      <p>{item.created_at ? new Date(item.created_at).toLocaleString("pt-BR") : "-"}</p>
                      <p>Usuário: {item.usuario || "-"}</p>
                    </div>
                  </div>

                  {item.tarefa_id ? (
                    <p className="mt-3 text-xs text-slate-500">
                      Tarefa relacionada: #{item.tarefa_id}
                    </p>
                  ) : null}

                  {item.meta ? (
                    <pre className="mt-3 overflow-auto rounded-xl bg-slate-100 p-3 text-xs text-slate-700">
                      {JSON.stringify(item.meta, null, 2)}
                    </pre>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}