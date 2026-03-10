"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";
export default function TesteSupabasePage() {
  const [mensagem, setMensagem] = useState("Ainda não testado.");

  async function testarConexao() {
    try {
      const { error } = await supabase.from("users").select("*").limit(1);

      if (error) {
        setMensagem(`Conexão feita, mas a tabela ainda não está pronta: ${error.message}`);
        return;
      }

      setMensagem("Conexão com o Supabase funcionando com sucesso.");
    } catch (erro) {
      setMensagem("Erro ao conectar com o Supabase.");
      console.error(erro);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-600">
          Teste
        </p>

        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          Teste de conexão com Supabase
        </h1>

        <p className="mt-4 text-slate-600">
          Clique no botão abaixo para verificar se o site está conseguindo se conectar ao banco.
        </p>

        <button
          onClick={testarConexao}
          className="mt-6 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Testar conexão
        </button>

        <div className="mt-6 rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">
          {mensagem}
        </div>
      </div>
    </main>
  );
}