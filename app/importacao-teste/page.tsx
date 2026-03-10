"use client";

import { useState } from "react";
import { importarLeadDaBaseGeral } from "../lib/importacao-base-geral";

export default function ImportacaoTestePage() {
  const [mensagem, setMensagem] = useState("");
  const [importando, setImportando] = useState(false);

  async function testarImportacao() {
    setImportando(true);
    setMensagem("");

    try {
      const resultado = await importarLeadDaBaseGeral({
        id_lead: `BG-TESTE-${Date.now()}`,
        data_entrada: new Date().toISOString(),
        nome: "Lead Teste Base Geral",
        telefone: "(11) 99999-0000",
        empreendimento: "Residencial Portento",
        origem: "Base Geral",
        campanha: "Teste Importação",
        etapa_funil: "Lead Novo",
        proxima_acao: "Primeiro contato",
        prioridade: "Alta",
        planilha_origem: "LEADS_CRM",
      });

      setMensagem(resultado.mensagem);
    } catch (error) {
      console.error(error);
      setMensagem("Erro ao importar lead teste.");
    }

    setImportando(false);
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-600">
          Teste
        </p>

        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          Teste de importação da Base Geral
        </h1>

        <p className="mt-4 text-slate-600">
          Este botão simula a entrada de um lead vindo da Base Geral.
        </p>

        <button
          onClick={testarImportacao}
          disabled={importando}
          className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-70"
        >
          {importando ? "Importando..." : "Importar lead teste"}
        </button>

        {mensagem ? (
          <div className="mt-6 rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">
            {mensagem}
          </div>
        ) : null}
      </div>
    </main>
  );
}