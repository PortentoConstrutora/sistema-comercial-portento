"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type KpiCard = {
  titulo: string;
  valor: string;
  variacao: string;
  positiva?: boolean;
};

type Modulo = {
  titulo: string;
  href: string;
  meta: string;
};

type RadarItem = {
  nome: string;
  curto: string;
  valor: number;
  detalhe: string;
  cor: string;
  stroke: string;
  dash: string;
  offset?: string;
};

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function SparkBars() {
  const dados = [
    { mes: "Jul", valor: "R$ 846 mil", altura: 96 },
    { mes: "Ago", valor: "R$ 601 mil", altura: 54 },
    { mes: "Set", valor: "R$ 788 mil", altura: 84 },
  ];
  const [ativo, setAtivo] = useState(dados[2]);

  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.26em] text-slate-400">
            Comparativo
          </p>
          <h3 className="mt-1.5 text-[1rem] font-bold tracking-tight text-slate-950">
            Venda total do mês
          </h3>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-semibold text-emerald-700">
          +12,8%
        </span>
      </div>

      <div className="mt-2 grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="flex flex-col justify-between rounded-[16px] bg-slate-50 p-3">
          <div>
            <div className="text-[1.45rem] font-bold tracking-tight text-slate-950">
              R$ 912 mil
            </div>
            <p className="mt-0.5 text-xs text-slate-500">vs R$ 808 mil mês anterior</p>
          </div>

          <div className="mt-4 rounded-2xl bg-white px-3 py-2">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              mês selecionado
            </p>
            <div className="mt-1 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-700">{ativo.mes}</p>
              <div className="text-right text-sm font-bold text-slate-950">{ativo.valor}</div>
            </div>
          </div>
        </div>

        <div className="rounded-[16px] bg-slate-50 px-3 py-3">
          <div className="flex h-[150px] items-end gap-3">
            {dados.map((item) => {
              const selecionado = ativo.mes === item.mes;
              return (
                <button
                  key={item.mes}
                  type="button"
                  onMouseEnter={() => setAtivo(item)}
                  onFocus={() => setAtivo(item)}
                  onClick={() => setAtivo(item)}
                  className="flex flex-1 flex-col items-center justify-end gap-2 outline-none"
                  title={`${item.mes}: ${item.valor}`}
                >
                  <div
                    className={classNames(
                      "w-full rounded-t-[14px] transition-all duration-200",
                      selecionado
                        ? "bg-gradient-to-t from-[#1d4ed8] via-[#3b82f6] to-[#93c5fd] shadow-[0_10px_20px_rgba(59,130,246,0.18)]"
                        : "bg-gradient-to-t from-[#2563eb] via-[#60a5fa] to-[#bfdbfe] opacity-80 hover:opacity-100"
                    )}
                    style={{ height: `${item.altura}px` }}
                  />
                  <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    {item.mes}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function LinePerformance() {
  const pontos = [
    { mes: "Jan", valor: "14 contatos qualificados" },
    { mes: "Fev", valor: "19 contatos qualificados" },
    { mes: "Mar", valor: "17 contatos qualificados" },
    { mes: "Abr", valor: "26 contatos qualificados" },
    { mes: "Mai", valor: "31 contatos qualificados" },
    { mes: "Jun", valor: "28 contatos qualificados" },
  ];
  const [ativo, setAtivo] = useState(pontos[3]);

  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[1rem] font-bold tracking-tight text-slate-950">
          Ritmo comercial
        </h3>
        <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[9px] font-semibold text-violet-700">
          90 dias
        </span>
      </div>

      <div className="mt-2.5 rounded-[16px] bg-slate-50 p-3">
        <div className="mb-2 rounded-2xl bg-white px-3 py-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-400">leitura</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-700">{ativo.mes}</p>
            </div>
            <div className="text-right text-sm font-bold text-slate-950">{ativo.valor}</div>
          </div>
        </div>

        <svg viewBox="0 0 520 220" className="h-44 w-full">
          {[34, 84, 134].map((y) => (
            <line key={y} x1="0" y1={y} x2="520" y2={y} stroke="#cbd5e1" strokeDasharray="6 8" strokeWidth="1" />
          ))}

          <defs>
            <linearGradient id="lineFillMainV24" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          <path
            d="M20 165 C 70 150, 105 118, 150 130 S 235 175, 290 112 S 380 82, 430 95 S 470 125, 500 88 L500 220 L20 220 Z"
            fill="url(#lineFillMainV24)"
          />
          <path
            d="M20 165 C 70 150, 105 118, 150 130 S 235 175, 290 112 S 380 82, 430 95 S 470 125, 500 88"
            fill="none"
            stroke="#2563eb"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M20 145 C 85 130, 120 170, 170 152 S 245 110, 290 136 S 360 188, 420 150 S 465 105, 500 122"
            fill="none"
            stroke="#5eead4"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {[
            { x: 20, y: 165, valor: pontos[0] },
            { x: 110, y: 130, valor: pontos[1] },
            { x: 200, y: 130, valor: pontos[2] },
            { x: 290, y: 112, valor: pontos[3] },
            { x: 380, y: 95, valor: pontos[4] },
            { x: 500, y: 88, valor: pontos[5] },
          ].map((ponto, i) => (
            <g key={i}>
              <circle cx={ponto.x} cy={ponto.y} r="10" fill="transparent" onMouseEnter={() => setAtivo(ponto.valor)} />
              <circle cx={ponto.x} cy={ponto.y} r="4.5" fill="#2563eb" />
            </g>
          ))}

          {[
            [20, "Jan"],
            [110, "Fev"],
            [200, "Mar"],
            [290, "Abr"],
            [380, "Mai"],
            [470, "Jun"],
          ].map(([x, label]) => (
            <text key={String(label)} x={Number(x)} y="210" fill="#94a3b8" fontSize="12" fontWeight="700">
              {label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

function RadarDonutCard() {
  const itens: RadarItem[] = [
    {
      nome: "Tarefas pendentes",
      curto: "tarefas",
      valor: 4,
      detalhe: "Pendentes para hoje",
      cor: "bg-[#2563eb]",
      stroke: "#2563eb",
      dash: "88 264",
    },
    {
      nome: "Propostas ativas",
      curto: "propostas",
      valor: 7,
      detalhe: "Em negociação",
      cor: "bg-[#22c55e]",
      stroke: "#22c55e",
      dash: "72 280",
      offset: "-96",
    },
    {
      nome: "Visitas confirmadas",
      curto: "visitas",
      valor: 5,
      detalhe: "Confirmadas no dia",
      cor: "bg-[#f59e0b]",
      stroke: "#f59e0b",
      dash: "58 294",
      offset: "-172",
    },
    {
      nome: "Fechamentos do dia",
      curto: "fechamentos",
      valor: 2,
      detalhe: "Alta chance hoje",
      cor: "bg-[#8b5cf6]",
      stroke: "#8b5cf6",
      dash: "38 314",
      offset: "-232",
    },
  ];

  const total = itens.reduce((acc, item) => acc + item.valor, 0);
  const [ativo, setAtivo] = useState<RadarItem | null>(null);

  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm">
      <h3 className="text-[1rem] font-bold tracking-tight text-slate-950">
        Radar do dia
      </h3>

      <div className="mt-2.5 rounded-[16px] bg-slate-50 p-3">
        <div className="grid items-center gap-2.5 md:grid-cols-[176px_1fr]">
          <div className="mx-auto relative h-[176px] w-[176px]">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
              <circle cx="60" cy="60" r="42" fill="none" stroke="#e2e8f0" strokeWidth="12" />
              {itens.map((item) => (
                <circle
                  key={item.nome}
                  cx="60"
                  cy="60"
                  r="42"
                  fill="none"
                  stroke={item.stroke}
                  strokeWidth="12"
                  strokeDasharray={item.dash}
                  strokeDashoffset={item.offset}
                  strokeLinecap="round"
                  className="cursor-pointer transition-all duration-200 hover:opacity-85"
                  onMouseEnter={() => setAtivo(item)}
                  onMouseLeave={() => setAtivo(null)}
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center">
              <span className="max-w-[92px] text-[9px] font-semibold uppercase leading-[1.08] tracking-[0.12em] text-slate-400">
                {ativo ? ativo.curto : "total do dia"}
              </span>
              <span className="mt-1 text-[2.15rem] font-bold leading-none tracking-tight text-slate-950">
                {ativo ? String(ativo.valor).padStart(2, "0") : String(total).padStart(2, "0")}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            {itens.map((item) => {
              const destacado = ativo?.nome === item.nome;
              return (
                <div
                  key={item.nome}
                  onMouseEnter={() => setAtivo(item)}
                  onMouseLeave={() => setAtivo(null)}
                  className={classNames(
                    "flex items-center justify-between rounded-2xl border px-3 py-2 transition",
                    destacado ? "border-slate-300 bg-white shadow-sm" : "border-slate-200 bg-white/85"
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={classNames("h-2.5 w-2.5 shrink-0 rounded-full", item.cor)} />
                    <div className="min-w-0">
                      <p className="truncate text-[0.94rem] font-semibold text-slate-900">{item.nome}</p>
                      <p className="text-[11px] text-slate-500">{item.detalhe}</p>
                    </div>
                  </div>
                  <div className="pl-1 text-[1.05rem] font-bold text-slate-950">
                    {String(item.valor).padStart(2, "0")}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function GaugeCard() {
  const percentual = 82;
  const emoji = percentual < 30 ? "🙁" : percentual < 60 ? "😬" : percentual < 90 ? "🙂" : "🤩";

  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm">
      <h3 className="text-[1rem] font-bold tracking-tight text-slate-950">
        Performance do mês
      </h3>

      <div className="mt-2.5 rounded-[16px] bg-slate-50 p-3">
        <div className="flex items-center justify-center">
          <div className="relative h-[188px] w-full max-w-[280px]">
            <svg viewBox="0 0 220 150" className="absolute inset-0 h-full w-full">
              <path
                d="M172 49 A90 90 0 0 1 200 126"
                fill="none"
                stroke="#d8dee8"
                strokeWidth="16"
                strokeLinecap="round"
              />
              <path
                d="M20 126 A90 90 0 0 1 172 49"
                fill="none"
                stroke="#60a5fa"
                strokeWidth="16"
                strokeLinecap="round"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-end pb-3 text-center">
              <div className="text-[3.4rem] leading-none">{emoji}</div>
              <div className="mt-1 text-[1.9rem] font-bold tracking-tight text-slate-950">{percentual}%</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                meta atingida
              </div>
            </div>
          </div>
        </div>

        <div className="-mt-3 grid grid-cols-3 gap-1.5 text-center">
          <div className="rounded-2xl bg-white px-2.5 py-2">
            <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">Meta</div>
            <div className="mt-1 text-[0.95rem] font-bold text-slate-950">R$ 1,1 mi</div>
          </div>
          <div className="rounded-2xl bg-white px-2.5 py-2">
            <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">Atual</div>
            <div className="mt-1 text-[0.95rem] font-bold text-slate-950">R$ 912 mil</div>
          </div>
          <div className="rounded-2xl bg-white px-2.5 py-2">
            <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">Gap</div>
            <div className="mt-1 text-[0.95rem] font-bold text-slate-950">R$ 188 mil</div>
          </div>
        </div>
      </div>
    </div>
  );
}

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

  const kpis = useMemo<KpiCard[]>(
    () => [
      { titulo: "Leads no mês", valor: "128", variacao: "+9%" },
      { titulo: "Tarefas abertas", valor: "08", variacao: "-2%", positiva: true },
      { titulo: "Visitas agendadas", valor: "05", variacao: "+14%" },
      { titulo: "Fechamentos", valor: "03", variacao: "+11%" },
    ],
    []
  );

  const modulos: Modulo[] = [
    { titulo: "CRM", href: "/crm", meta: "Base e funil" },
    { titulo: "Minha Agenda", href: "/minha-agenda", meta: "Visitas" },
    { titulo: "Diário de Bordo", href: "/diario", meta: "Lançamentos" },
    { titulo: "Meus Fechamentos", href: "/fechamentos", meta: "Resultado" },
  ];

  const atalhos =
    perfil === "diretoria" || perfil === "admin"
      ? [...modulos, { titulo: "Diretoria", href: "/diretoria", meta: "Visão executiva" }]
      : modulos;

  if (!carregado) return null;

  return (
    <main className="min-h-[calc(100vh-84px)] bg-[#f3f6fb]">
      <div className="mx-auto w-full max-w-[1520px] px-4 py-3 sm:px-6 lg:px-8 xl:px-10">
        <section>
          <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.18),_transparent_18%),linear-gradient(135deg,#07143a_0%,#0c214f_48%,#1e315a_100%)] p-4 text-white shadow-[0_20px_50px_rgba(15,23,42,0.16)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-300">
                  Dashboard comercial
                </p>
                <h1 className="mt-3 text-[1.85rem] font-bold tracking-tight sm:text-[2rem]">
                  Bem-vindo, {nome}
                </h1>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href="/tarefas-crm"
                  className="rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
                >
                  Abrir tarefas
                </Link>
                <Link
                  href="/crm/meus-leads"
                  className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Ver meus leads
                </Link>
              </div>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {kpis.map((item) => (
                <div key={item.titulo} className="rounded-[16px] border border-white/10 bg-white/8 px-4 py-1.5 backdrop-blur-sm">
                  <p className="text-[0.84rem] text-slate-300">{item.titulo}</p>
                  <div className="mt-1 flex items-end justify-between gap-3">
                    <p className="text-[1.18rem] font-bold leading-none tracking-tight text-white">{item.valor}</p>
                    <span
                      className={classNames(
                        "rounded-full px-2.5 py-1 text-[9px] font-semibold",
                        item.positiva ? "bg-emerald-400/15 text-emerald-200" : "bg-sky-400/15 text-sky-200"
                      )}
                    >
                      {item.variacao}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-3 grid gap-3 xl:grid-cols-[0.9fr_1.08fr_1.02fr]">
          <GaugeCard />
          <RadarDonutCard />
          <LinePerformance />
        </section>

        <section className="mt-3 grid gap-3 xl:grid-cols-[0.86fr_1.14fr]">
          <SparkBars />

          <div className="rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.26em] text-slate-400">
                  Atalhos
                </p>
                <h3 className="mt-1.5 text-[1rem] font-bold tracking-tight text-slate-950">
                  Módulos
                </h3>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-semibold text-slate-600">
                acesso rápido
              </span>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {atalhos.slice(0, 4).map((modulo) => (
                <Link
                  key={modulo.href}
                  href={modulo.href}
                  className="group rounded-[18px] border border-slate-200 bg-slate-50 p-3 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-[0.98rem] font-bold text-slate-950">{modulo.titulo}</h4>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      {modulo.meta}
                    </span>
                  </div>
                  <div className="mt-2 text-[0.95rem] font-semibold text-blue-700 transition group-hover:text-blue-800">
                    Abrir módulo →
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
