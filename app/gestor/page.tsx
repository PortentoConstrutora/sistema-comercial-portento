"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function GestorPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [usuario, setUsuario] = useState("");

  useEffect(() => {
    const logado = localStorage.getItem("portento_logado");
    const perfil = localStorage.getItem("portento_perfil");

    if (logado !== "sim") {
      router.push("/login");
      return;
    }

    if (perfil !== "gestor") {
      router.push("/painel");
      return;
    }

    setNome(localStorage.getItem("portento_nome") || "");
    setUsuario(localStorage.getItem("portento_usuario") || "");
  }, [router]);

  function sair() {
    localStorage.removeItem("portento_logado");
    localStorage.removeItem("portento_usuario");
    localStorage.removeItem("portento_nome");
    localStorage.removeItem("portento_perfil");
    router.push("/login");
  }

const cards = [
  {
    titulo: "Meus Leads",
    descricao: "Leads recebidos, etapas do funil e acompanhamento comercial.",
    href: "/crm",
  },
  {
    titulo: "Minhas Tarefas",
    descricao: "Pendências, primeiro contato, retornos e prazos.",
    href: "/agenda",
  },
  {
  titulo: "Minha Agenda",
  descricao: "Visitas, compromissos e atividades futuras.",
  href: "/minha-agenda",
},
  {
    titulo: "Diário de Bordo",
    descricao: "Registro diário das atividades do gestor.",
    href: "/diario",
  },
  {
    titulo: "Meus Fechamentos",
    descricao: "Controle dos fechamentos em andamento.",
    href: "/fechamentos",
  },
];

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="mb-8 rounded-3xl bg-slate-900 px-6 py-8 text-white shadow-xl md:px-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-300">
                Área do Gestor
              </p>
              <h1 className="mt-3 text-3xl font-bold md:text-5xl">
                Bem-vindo, {nome || "Gestor"}
              </h1>
              <p className="mt-4 text-sm text-slate-200 md:text-base">
                Usuário: <strong>{usuario}</strong>
              </p>
            </div>

            <button
              onClick={sair}
              className="rounded-xl bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Sair
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.titulo}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <h2 className="text-xl font-bold text-slate-900">
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
      </div>
    </main>
  );
}