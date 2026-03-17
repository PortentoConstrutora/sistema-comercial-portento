"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import "./globals.css";

// Ajuste o caminho se necessário:
import NotificationBell from "@/app/components/NotificationBell";

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

  function sairDoSistema() {
    localStorage.removeItem("portento_logado");
    localStorage.removeItem("portento_usuario");
    localStorage.removeItem("portento_nome");
    localStorage.removeItem("portento_perfil");

    setUsuario("");
    setNome("");
    setPerfil("");
    setLogado(false);

    window.location.href = "/login";
  }

  const linksBase = [
    { label: "Início", href: "/" },
    { label: "CRM", href: "/crm" },
    { label: "Tarefas CRM", href: "/agenda" },
    { label: "Minha Agenda", href: "/minha-agenda" },
    { label: "Diário", href: "/diario" },
    { label: "Fechamentos", href: "/fechamentos" },
  ];

  const links =
    perfil === "diretoria" || perfil === "admin"
      ? [...linksBase, { label: "Diretoria", href: "/diretoria" }]
      : linksBase;

  const paginaLogin = pathname === "/login";
  const mostrarHeader = carregado && logado && !paginaLogin;

  return (
    <html lang="pt-BR">
      <body className="bg-slate-100 text-slate-900">
        {mostrarHeader ? (
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

              <nav className="flex flex-wrap items-center gap-2">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-900 hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}

                <div className="ml-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                  {nome || usuario || "Usuário"} {perfil ? `• ${perfil}` : ""}
                </div>

                <NotificationBell />

                <button
                  onClick={sairDoSistema}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Sair
                </button>
              </nav>
            </div>
          </header>
        ) : null}

        {children}
      </body>
    </html>
  );
}