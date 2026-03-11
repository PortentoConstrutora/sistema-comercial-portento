"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [usuario, setUsuario] = useState("");
  const [perfil, setPerfil] = useState("");
  const [logado, setLogado] = useState(false);

  const cards = [
    {
      titulo: "CRM",
      descricao: "Leads, tarefas, funil e acompanhamento comercial.",
      status: "Módulo comercial",
      href: "/crm",
    },
    {
      titulo: "Minhas Tarefas",
      descricao: "Tarefas, retornos, prazos e pendências.",
      status: "Organização diária",
      href: "/agenda",
    },
    {
      titulo: "Diário de Bordo",
      descricao: "Registro diário das atividades comerciais.",
      status: "Controle operacional",
      href: "/diario",
    },
    {
      titulo: "Fechamentos",
      descricao: "Controle dos fechamentos e evolução comercial.",
      status: "Resultados comerciais",
      href: "/fechamentos",
    },
  ];

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem("portento_usuario") || "";
    const perfilSalvo = localStorage.getItem("portento_perfil") || "";
    const logadoSalvo = localStorage.getItem("portento_logado") === "sim";

    setUsuario(usuarioSalvo);
    setPerfil(perfilSalvo);
    setLogado(logadoSalvo);
  }, []);

  function getPainelLink() {
    if (perfil === "diretoria" || perfil === "admin") return "/diretoria";
    return "/crm";
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <section className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
        <header className="mb-8 rounded-3xl bg-slate-900 px-6 py-8 text-white shadow-xl md:px-10 md:py-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-amber-300 md:text-sm">
                Portento Construtora
              </p>

              <h1 className="text-3xl font-bold md:text-5xl">
                Sistema Comercial • Portento
              </h1>

              <p className="mt-4 max-w-2xl text-sm text-slate-200 md:text-base">
                Plataforma comercial com CRM, tarefas, diário de bordo,
                fechamentos e área de diretoria.
              </p>

              {logado ? (
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm">
                    Logado como <strong>{usuario || "Usuário"}</strong>
                    {perfil ? <> • Perfil: <strong>{perfil}</strong></> : null}
                  </div>

                  <Link
                    href={getPainelLink()}
                    className="inline-block rounded-xl bg-amber-400 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-amber-300"
                  >
                    Entrar no painel
                  </Link>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="mt-6 inline-block rounded-xl bg-amber-400 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-amber-300"
                >
                  Acessar sistema
                </Link>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm">
              <p className="text-slate-200">Ambiente inicial do projeto</p>
              <p className="mt-1 font-semibold text-white">
                Estrutura em construção
              </p>
            </div>
          </div>
        </header>

        <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <div
              key={card.titulo}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
              <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                {card.status}
              </span>

              <h2 className="mt-4 text-xl font-bold text-slate-900">
                {card.titulo}
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                {card.descricao}
              </p>

              <Link
                href={card.href}
                className="mt-6 inline-block rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Entrar
              </Link>
            </div>
          ))}
        </section>
      </section>
    </main>
  );
}