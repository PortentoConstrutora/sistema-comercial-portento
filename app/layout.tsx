"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import "./globals.css";
import NotificationBell from "@/app/components/NotificationBell";

type LinkItem = {
  label: string;
  href: string;
};

function getLinkClasses(isActive: boolean) {
  return [
    "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition",
    isActive
      ? "bg-slate-900 text-white shadow-sm"
      : "text-slate-700 hover:bg-white hover:shadow-sm",
  ].join(" ");
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  const [usuario, setUsuario] = useState("");
  const [nome, setNome] = useState("");
  const [perfil, setPerfil] = useState("");
  const [logado, setLogado] = useState(false);
  const [carregado, setCarregado] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem("portento_usuario") || "";
    const nomeSalvo = localStorage.getItem("portento_nome") || "";
    const perfilSalvo = localStorage.getItem("portento_perfil") || "";
    const logadoSalvo = localStorage.getItem("portento_logado") === "sim";

    setUsuario(usuarioSalvo);
    setNome(nomeSalvo);
    setPerfil(perfilSalvo);
    setLogado(logadoSalvo);
    setCarregado(true);
  }, [pathname]);

  useEffect(() => {
    setMenuAberto(false);
  }, [pathname]);

  function sairDoSistema() {
    localStorage.removeItem("portento_logado");
    localStorage.removeItem("portento_usuario");
    localStorage.removeItem("portento_nome");
    localStorage.removeItem("portento_perfil");
    window.location.href = "/login";
  }

  const nomeExibicao = nome || usuario || "Usuário";
  const perfilExibicao = perfil ? perfil.charAt(0).toUpperCase() + perfil.slice(1) : "Gestor";
  const paginaLogin = pathname === "/login";
  const mostrarHeader = carregado && logado && !paginaLogin;

  const links = useMemo<LinkItem[]>(() => {
    const base: LinkItem[] = [
      { label: "Início", href: "/" },
      { label: "CRM", href: "/crm" },
      { label: "Novos Leads", href: "/crm/meus-leads" },
      { label: "Tarefas CRM", href: "/tarefas-crm" },
      { label: "Meus Leads", href: "/crm/todos-leads" },
      { label: "Minha Agenda", href: "/minha-agenda" },
      { label: "Diário", href: "/diario" },
      { label: "Fechamentos", href: "/fechamentos" },
    ];

    if (perfil === "diretoria" || perfil === "admin") {
      return [...base, { label: "Diretoria", href: "/diretoria" }];
    }

    return base;
  }, [perfil]);

  return (
    <html lang="pt-BR">
      <body className="bg-slate-100 text-slate-900">
        {mostrarHeader ? (
          <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="mx-auto w-full max-w-[1550px] px-4 py-3 sm:px-6 lg:px-8">
              <div className="relative flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 pt-1">
                  <img
                    src="/logo-p-portento.jpg"
                    alt="Portento"
                    className="h-12 w-auto object-contain sm:h-14"
                  />

                  <div className="hidden min-[900px]:block">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-amber-600">
                      Portento Construtora
                    </p>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                      Sistema Comercial
                    </h1>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="min-[900px]:hidden text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-amber-600">
                      Portento Construtora
                    </p>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                      Sistema Comercial
                    </h1>
                  </div>

                  <div className="mt-1 hidden min-[900px]:flex items-center justify-center">
                    <nav className="flex flex-wrap items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50/90 px-3 py-2 shadow-sm">
                      {links.map((link) => {
                        const ativo =
                          link.href === "/"
                            ? pathname === "/"
                            : pathname === link.href || pathname.startsWith(`${link.href}/`);

                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            className={getLinkClasses(ativo)}
                          >
                            {link.label}
                          </Link>
                        );
                      })}
                    </nav>
                  </div>
                </div>

                <div className="hidden min-[900px]:flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    <NotificationBell />
                    <button
                      onClick={sairDoSistema}
                      className="inline-flex h-10 items-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Sair
                    </button>
                  </div>

                  <p className="pr-1 text-sm font-medium text-slate-500">
                    {perfilExibicao} • {nomeExibicao}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between min-[900px]:hidden">
                <div className="text-sm text-slate-500">
                  {perfilExibicao} • {nomeExibicao}
                </div>

                <div className="flex items-center gap-2">
                  <NotificationBell />

                  <button
                    type="button"
                    onClick={() => setMenuAberto((valor) => !valor)}
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    {menuAberto ? "Fechar" : "Menu"}
                  </button>
                </div>
              </div>

              {menuAberto ? (
                <div className="mt-3 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm min-[900px]:hidden">
                  <nav className="grid gap-2">
                    {links.map((link) => {
                      const ativo =
                        link.href === "/"
                          ? pathname === "/"
                          : pathname === link.href || pathname.startsWith(`${link.href}/`);

                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={getLinkClasses(ativo)}
                        >
                          {link.label}
                        </Link>
                      );
                    })}
                  </nav>

                  <div className="mt-3 border-t border-slate-200 pt-3">
                    <button
                      onClick={sairDoSistema}
                      className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Sair
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </header>
        ) : null}

        {children}
      </body>
    </html>
  );
}
