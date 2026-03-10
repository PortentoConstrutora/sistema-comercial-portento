"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DiretoriaPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");

  useEffect(() => {
    const logado = localStorage.getItem("portento_logado");
    const perfil = localStorage.getItem("portento_perfil");

    if (logado !== "sim") {
      router.push("/login");
      return;
    }

    if (perfil !== "diretoria") {
      router.push("/painel");
      return;
    }

    setNome(localStorage.getItem("portento_nome") || "");
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-600">
          Área da Diretoria
        </p>

        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          Bem-vindo, {nome || "Diretoria"}
        </h1>

        <p className="mt-4 text-slate-600">
          Aqui depois vamos colocar:
        </p>

        <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-600">
          <li>Dashboard geral</li>
          <li>Comparativo entre gestores</li>
          <li>CRM completo</li>
          <li>Agenda geral</li>
          <li>Diário e fechamentos de todos</li>
        </ul>
      </div>
    </main>
  );
}