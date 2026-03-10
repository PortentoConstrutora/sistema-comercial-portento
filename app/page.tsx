import Link from "next/link";

export default function Home() {
  const cards = [
    {
      titulo: "CRM",
      descricao: "Leads, tarefas, funil e acompanhamento comercial.",
      status: "Módulo comercial",
      href: "/crm",
    },
    {
      titulo: "Agenda",
      descricao: "Compromissos, lembretes e atividades futuras.",
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
                Plataforma comercial com CRM, agenda, diário de bordo,
                fechamentos e área de diretoria.
              </p>
            </div>
<Link
  href="/login"
  className="mt-6 inline-block rounded-xl bg-amber-400 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-amber-300"
>
  Acessar sistema
</Link>
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

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="text-base font-bold text-slate-900">
              Próximo passo
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Criar a navegação real entre módulos e organizar melhor a página
              inicial.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="text-base font-bold text-slate-900">
              Depois disso
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Vamos ligar login, perfis de acesso, CRM, agenda e diretoria.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="text-base font-bold text-slate-900">
              Visual final
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Logo, centralização, menu, versão celular e layout profissional
              serão ajustados nas próximas etapas.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}