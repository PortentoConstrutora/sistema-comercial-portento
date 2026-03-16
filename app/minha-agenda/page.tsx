"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MinhaAgendaPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [usuario, setUsuario] = useState("");
  const [perfil, setPerfil] = useState("");

  useEffect(() => {
    const logado = localStorage.getItem("portento_logado");
    const nomeSalvo = localStorage.getItem("portento_nome");
    const usuarioSalvo = localStorage.getItem("portento_usuario");
    const perfilSalvo = localStorage.getItem("portento_perfil");

    if (logado !== "sim") {
      router.push("/login");
      return;
    }

    setNome(nomeSalvo || "");
    setUsuario(usuarioSalvo || "");
    setPerfil(perfilSalvo || "");
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="mb-8 rounded-3xl bg-slate-900 px-6 py-8 text-white shadow-xl md:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-300">
            Agenda
          </p>

          <h1 className="mt-3 text-3xl font-bold md:text-5xl">
            Minha Agenda
          </h1>

          <p className="mt-4 text-sm text-slate-200 md:text-base">
            Visitas, compromissos e atividades futuras sem depender de lead.
          </p>

          <p className="mt-4 text-sm text-slate-300">
            Usuário logado: <strong>{nome || usuario || "Carregando..."}</strong>
          </p>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Módulo em construção
          </h2>

          <p className="mt-3 text-sm text-slate-600">
            Aqui vamos cadastrar compromissos, visitas, lembretes e atividades futuras.
          </p>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => router.push("/gestor")}
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