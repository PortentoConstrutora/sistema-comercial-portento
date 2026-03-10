"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function NovoLeadPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [empreendimento, setEmpreendimento] = useState("");
  const [origem, setOrigem] = useState("");
  const [campanha, setCampanha] = useState("");
  const [proximaAcao, setProximaAcao] = useState("Primeiro contato");
  const [salvando, setSalvando] = useState(false);

  async function criarLead() {
  const usuarioAtual = localStorage.getItem("portento_usuario") || "";
  const nomeUsuario = localStorage.getItem("portento_nome") || "";

  if (!nome.trim()) {
    alert("Preencha o nome do lead.");
    return;
  }

  setSalvando(true);

  const idLead = `SITE-${Date.now()}`;

  const { data: leadExistente, error: erroBuscaLead } = await supabase
    .from("crm_leads")
    .select("id, id_lead")
    .eq("id_lead", idLead)
    .maybeSingle();

  if (erroBuscaLead) {
    console.error(erroBuscaLead);
    alert("Erro ao verificar duplicidade do lead.");
    setSalvando(false);
    return;
  }

  if (leadExistente) {
    alert("Já existe um lead com esse ID.");
    setSalvando(false);
    return;
  }

   const { data: leadCriado, error: leadError } = await supabase
    .from("crm_leads")
    .insert({
      id_lead: idLead,
      nome: nome.trim(),
      telefone: telefone.trim(),
      empreendimento: empreendimento.trim(),
      origem: origem.trim() || "Cadastro manual",
      campanha: campanha.trim() || "Site",
      gestor: usuarioAtual,
      status_lead: "Novo",
      etapa_funil: "Lead Novo",
      proxima_acao: proximaAcao.trim(),
      ultima_atualizacao: new Date().toISOString(),
    })
    .select()
    .single();

  if (leadError || !leadCriado) {
    console.error(leadError);
    alert("Erro ao criar lead.");
    setSalvando(false);
    return;
  }

  const prazoHoje = new Date();
  prazoHoje.setHours(18, 0, 0, 0);

  const { data: tarefaCriada, error: tarefaError } = await supabase
    .from("crm_tarefas")
    .insert({
      lead_id: leadCriado.id,
      tipo: "Primeiro contato",
      status: "Pendente",
      prazo: prazoHoje.toISOString(),
      observacao: `Tarefa automática criada para o lead ${leadCriado.nome}.`,
      gestor: usuarioAtual,
      atualizado_em: new Date().toISOString(),
    })
    .select()
    .single();

  if (tarefaError) {
    console.error(tarefaError);
    alert("Lead criado, mas deu erro ao criar a tarefa automática.");
    setSalvando(false);
    return;
  }

  const { error: historicoError } = await supabase
    .from("crm_historico")
    .insert({
      lead_id: leadCriado.id,
      tarefa_id: tarefaCriada?.id ?? null,
      usuario: usuarioAtual,
      tipo_evento: "lead_criado",
descricao: `Lead "${leadCriado.nome}" criado por ${nomeUsuario}. Tarefa automática "Primeiro contato" gerada para o próprio gestor.`,    });

  if (historicoError) {
    console.error(historicoError);
    alert("Lead e tarefa criados, mas deu erro ao gravar histórico.");
  }

  const { error: distribuicaoLogError } = await supabase
  .from("crm_distribuicao_log")
  .insert({
    lead_id: leadCriado.id,
    id_lead: leadCriado.id_lead,
    gestor: usuarioAtual,
    regra_aplicada: "cadastro_manual",
    observacao: `Lead criado manualmente e atribuído ao gestor logado ${usuarioAtual}.`,
  });

if (distribuicaoLogError) {
  console.error(distribuicaoLogError);
  alert("Lead criado, mas deu erro ao gravar o log de distribuição.");
}

 alert("Lead criado com tarefa automática para o gestor logado.");
  setSalvando(false);
  router.push("/crm");
}

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-5xl">
        <section className="mb-6 rounded-3xl bg-slate-900 px-6 py-8 text-white shadow-xl md:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-300">
            Novo Lead
          </p>

          <h1 className="mt-3 text-3xl font-bold md:text-5xl">
            Cadastro de Lead
          </h1>

          <p className="mt-4 text-sm text-slate-200 md:text-base">
            Criar lead manualmente com tarefa automática de primeiro contato.
          </p>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Nome
              </label>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Telefone
              </label>
              <input
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Empreendimento
              </label>
              <input
                value={empreendimento}
                onChange={(e) => setEmpreendimento(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Origem
              </label>
              <input
                value={origem}
                onChange={(e) => setOrigem(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Campanha
              </label>
              <input
                value={campanha}
                onChange={(e) => setCampanha(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Próxima ação
              </label>
              <input
                value={proximaAcao}
                onChange={(e) => setProximaAcao(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={criarLead}
              disabled={salvando}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-70"
            >
              {salvando ? "Salvando..." : "Criar lead"}
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