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

function getEventoLabel(tipo?: string | null) {
  switch (tipo) {
    case "lead_criado":
      return "Lead criado";
    case "contato_inicial":
      return "Contato inicial";
    case "tarefa_concluida":
      return "Tarefa concluída";
    case "notificacao_visualizada":
      return "Notificação visualizada";
    default:
      return tipo || "Evento";
  }
}

function getEventoBadgeClasses(tipo?: string | null) {
  switch (tipo) {
    case "lead_criado":
      return "bg-blue-100 text-blue-700";
    case "contato_inicial":
      return "bg-emerald-100 text-emerald-700";
    case "tarefa_concluida":
      return "bg-amber-100 text-amber-700";
    case "notificacao_visualizada":
      return "bg-violet-100 text-violet-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function formatarData(data?: string | null) {
  if (!data) return "-";

  return new Date(data).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

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
            <div className="space-y-5">
             {historico.map((item) => (
  <div
    key={item.id}
    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
  >
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="flex-1">
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getEventoBadgeClasses(
            item.tipo_evento
          )}`}
        >
          {getEventoLabel(item.tipo_evento)}
        </span>

        <p className="mt-3 text-sm leading-6 text-slate-700">
          {item.descricao || "Sem descrição para este evento."}
        </p>

        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
          {item.tarefa_id ? (
            <span className="rounded-lg bg-slate-100 px-2 py-1">
              Tarefa #{item.tarefa_id}
            </span>
          ) : null}

          {item.usuario ? (
            <span className="rounded-lg bg-slate-100 px-2 py-1">
              Usuário: {item.usuario}
            </span>
          ) : null}
        </div>

        {item.meta ? (
          <details className="mt-4 rounded-xl bg-slate-50 p-3">
            <summary className="cursor-pointer text-xs font-semibold text-slate-600">
              Ver detalhes técnicos
            </summary>

            <pre className="mt-3 overflow-auto text-xs text-slate-700">
              {JSON.stringify(item.meta, null, 2)}
            </pre>
          </details>
        ) : null}
      </div>

      <div className="min-w-[140px] text-left text-xs text-slate-500 md:text-right">
        <p className="font-medium text-slate-600">Data</p>
        <p>{formatarData(item.created_at)}</p>
      </div>
    </div>
  </div>
))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}