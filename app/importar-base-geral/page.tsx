"use client";

import { useState } from "react";
import { importarLeadDaBaseGeral } from "../lib/importacao-base-geral";

export default function ImportarBaseGeralPage() {
  const [idLead, setIdLead] = useState("");
  const [dataEntrada, setDataEntrada] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [empreendimento, setEmpreendimento] = useState("");
  const [origem, setOrigem] = useState("");
  const [campanha, setCampanha] = useState("");
  const [etapaFunil, setEtapaFunil] = useState("Lead Novo");
  const [proximaAcao, setProximaAcao] = useState("Primeiro contato");
  const [prioridade, setPrioridade] = useState("Média");
  const [planilhaOrigem, setPlanilhaOrigem] = useState("LEADS_CRM");
  const [mensagem, setMensagem] = useState("");
  const [importando, setImportando] = useState(false);

  async function importarAgora() {
    setMensagem("");

    if (!idLead.trim()) {
      setMensagem("Preencha o ID Lead.");
      return;
    }

    if (!nome.trim()) {
      setMensagem("Preencha o nome do cliente.");
      return;
    }

    setImportando(true);

    try {
      const resultado = await importarLeadDaBaseGeral({
        id_lead: idLead.trim(),
        data_entrada: dataEntrada.trim() || new Date().toISOString(),
        nome: nome.trim(),
        telefone: telefone.trim(),
        empreendimento: empreendimento.trim(),
        origem: origem.trim(),
        campanha: campanha.trim(),
        etapa_funil: etapaFunil.trim(),
        proxima_acao: proximaAcao.trim(),
        prioridade: prioridade.trim(),
        planilha_origem: planilhaOrigem.trim(),
      });

      setMensagem(resultado.mensagem);

      if (resultado.ok) {
        setIdLead("");
        setDataEntrada("");
        setNome("");
        setTelefone("");
        setEmpreendimento("");
        setOrigem("");
        setCampanha("");
        setEtapaFunil("Lead Novo");
        setProximaAcao("Primeiro contato");
        setPrioridade("Média");
        setPlanilhaOrigem("LEADS_CRM");
      }
    } catch (error) {
      console.error(error);
      setMensagem("Erro ao importar lead da Base Geral.");
    }

    setImportando(false);
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-5xl">
        <section className="mb-6 rounded-3xl bg-slate-900 px-6 py-8 text-white shadow-xl md:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-300">
            Importação Manual
          </p>

          <h1 className="mt-3 text-3xl font-bold md:text-5xl">
            Base Geral → CRM
          </h1>

          <p className="mt-4 text-sm text-slate-200 md:text-base">
            Use esta tela para testar a entrada de leads reais da Base Geral no CRM.
          </p>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                ID Lead
              </label>
              <input
                value={idLead}
                onChange={(e) => setIdLead(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Data Entrada
              </label>
              <input
                value={dataEntrada}
                onChange={(e) => setDataEntrada(e.target.value)}
                placeholder="2026-03-10T17:00:00.000Z"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Nome Cliente
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
                Etapa Funil
              </label>
              <input
                value={etapaFunil}
                onChange={(e) => setEtapaFunil(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Próxima Ação
              </label>
              <input
                value={proximaAcao}
                onChange={(e) => setProximaAcao(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Prioridade
              </label>
              <input
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Planilha Origem
              </label>
              <input
                value={planilhaOrigem}
                onChange={(e) => setPlanilhaOrigem(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={importarAgora}
              disabled={importando}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-70"
            >
              {importando ? "Importando..." : "Importar para o CRM"}
            </button>
          </div>

          {mensagem ? (
            <div className="mt-6 rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">
              {mensagem}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}