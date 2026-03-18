"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ModuloCard = {
  titulo: string;
  descricao: string;
  href: string;
  valor: string;
  detalhe: string;
};

export default function HomePage() {
  const [nome, setNome] = useState("Usuário");
  const [perfil, setPerfil] = useState("gestor");
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    const nomeSalvo =
      localStorage.getItem("portento_nome") ||
      localStorage.getItem("portento_usuario") ||
      "Usuário";
    const perfilSalvo = localStorage.getItem("portento_perfil") || "gestor";

    setNome(nomeSalvo);
    setPerfil(perfilSalvo);
    setCarregado(true);
  }, []);

  const indicadores = useMemo(() => {
    return [
      { titulo: "Leads novos", valor: "12", apoio: "semana" },
      { titulo: "Tarefas hoje", valor: "08", apoio: "prioridades" },
      { titulo: "Agenda", valor: "05", apoio: "visitas" },
      { titulo: "Fechamentos", valor: "03", apoio: "mês" },
    ];
  }, []);

  const modulosBase: ModuloCard[] = [
    {
      titulo: "CRM",
      descricao: "Leads, origem, funil e acompanhamento comercial.",
      href: "/crm",
      valor: "124",
      detalhe: "leads em base",
    },
    {
      titulo: "Tarefas CRM",
      descricao: "Retornos, pendências e próximas ações dos leads.",
      href: "/tarefas-crm",
      valor: "08",
      detalhe: "em aberto hoje",
    },
    {
      titulo: "Minha Agenda",
      descricao: "Compromissos, visitas e horários da operação.",
      href: "/minha-agenda",
      valor: "05",
      detalhe: "visitas previstas",
    },
    {
      titulo: "Diário Comercial",
      descricao: "Registros do dia, observações e evolução da rotina.",
      href: "/diario",
      valor: "14",
      detalhe: "lançamentos no mês",
    },
    {
      titulo: "Fechamentos",
      descricao: "Propostas, negociações e resultados comerciais.",
      href: "/fechamentos",
      valor: "03",
      detalhe: "em negociação",
    },
  ];

  const modulos =
    perfil === "diretoria" || perfil === "admin"
      ? [
          ...modulosBase,
          {
            titulo: "Diretoria",
            descricao: "Visão executiva do resultado comercial.",
            href: "/diretoria",
            valor: "92%",
            detalhe: "meta do período",
          },
        ]
      : modulosBase;

  const resumoOperacional = [
    { titulo: "Atrasadas", valor: "04", cor: "text-rose-600", fundo: "bg-rose-50" },
    { titulo: "Visitas", valor: "05", cor: "text-sky-700", fundo: "bg-sky-50" },
    { titulo: "Propostas", valor: "07", cor: "text-amber-700", fundo: "bg-amber-50" },
    { titulo: "Conversão", valor: "18%", cor: "text-emerald-700", fundo: "bg-emerald-50" },
    { titulo: "Pendências", valor: "09", cor: "text-slate-700", fundo: "bg-slate-100" },
  ];

  if (!carregado) return null;

  return (
    <main className="min-h-[calc(100vh-84px)] bg-gradient-to-b from-slate-100 via-slate-100 to-slate-200">
      <div className="mx-auto w-full max-w-[1550px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-r from-[#fff8ec] via-white to-[#eef4ff] shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <div className="h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />

          <div className="px-5 py-6 sm:px-7 sm:py-7 lg:px-10 lg:py-8">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">
                Painel de operação comercial
              </p>

              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl lg:text-[2.5rem]">
                Sistema Comercial
              </h1>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-700">
                  Bem Vindo,
                  <span className="ml-1 font-semibold text-slate-950">{nome}</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {indicadores.map((item) => (
            <div
              key={item.titulo}
              className="rounded-[22px] border border-slate-200 bg-white px-5 py-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-500">{item.titulo}</p>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                  {item.apoio}
                </span>
              </div>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{item.valor}</p>
            </div>
          ))}
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          {modulos.map((modulo) => (
            <Link
              key={modulo.href}
              href={modulo.href}
              className="group rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500">{modulo.titulo}</p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                    {modulo.valor}
                  </p>
                </div>

                <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white">
                  {modulo.detalhe}
                </span>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-600">
                {modulo.descricao}
              </p>
            </Link>
          ))}
        </section>

        <section className="mt-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-700">
                Dashboard operacional
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                Resumo do dia
              </h2>
            </div>

            <p className="text-sm text-slate-500">
              Visão rápida das frentes que exigem acompanhamento.
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {resumoOperacional.map((item) => (
              <div
                key={item.titulo}
                className={`rounded-[22px] border border-slate-200 px-4 py-4 ${item.fundo}`}
              >
                <p className="text-sm font-semibold text-slate-500">{item.titulo}</p>
                <p className={`mt-2 text-3xl font-bold tracking-tight ${item.cor}`}>{item.valor}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
