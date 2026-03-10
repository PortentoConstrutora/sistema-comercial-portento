export default function AgendaPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-600">
            Módulo
          </p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">Agenda</h1>
          <p className="mt-4 text-slate-600">
            Aqui ficará a agenda de compromissos, lembretes, visitas e
            atividades futuras.
          </p>
        </div>
      </div>
    </main>
  );
}