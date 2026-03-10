"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PainelPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");

  useEffect(() => {
    const logado = localStorage.getItem("portento_logado");
    const usuarioSalvo = localStorage.getItem("portento_usuario");

    if (logado !== "sim") {
      router.push("/login");
      return;
    }

    setUsuario(usuarioSalvo || "");
  }, [router]);

  function sair() {
    localStorage.removeItem("portento_logado");
    localStorage.removeItem("portento_usuario");
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-600">
            Área protegida
          </p>

          <h1 className="mt-3 text-3xl font-bold text-slate-900">Painel</h1>

          <p className="mt-4 text-slate-600">
            Usuário logado: <strong>{usuario || "Carregando..."}</strong>
          </p>

          <p className="mt-3 text-slate-600">
            Você entrou no sistema. Depois vamos trocar esta área pelo painel
            real com CRM, Agenda, Diário, Fechamentos e Diretoria.
          </p>

          <button
            onClick={sair}
            className="mt-6 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Sair
          </button>
        </div>
      </div>
    </main>
  );
}