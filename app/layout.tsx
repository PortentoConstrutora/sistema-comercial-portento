import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sistema Comercial • Portento",
  description: "Sistema comercial da Portento Construtora",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const links = [
    { label: "Início", href: "/" },
    { label: "CRM", href: "/crm" },
    { label: "Agenda", href: "/agenda" },
    { label: "Diário", href: "/diario" },
    { label: "Fechamentos", href: "/fechamentos" },
  ];

  return (
    <html lang="pt-BR">
      <body className="bg-slate-100 text-slate-900">
        <header className="border-b border-slate-200 bg-white shadow-sm">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">
                Portento Construtora
              </p>
              <h1 className="text-xl font-bold text-slate-900 md:text-2xl">
                Sistema Comercial
              </h1>
            </div>

            <nav className="flex flex-wrap gap-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-900 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        {children}
      </body>
    </html>
  );
}