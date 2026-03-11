"use client";

import type { Metadata } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./globals.css";

// Remova export const metadata daqui se der erro por ser client component

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [perfil, setPerfil] = useState("");
  const [logado, setLogado] = useState(false);

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem("portento_usuario") || "";
    const perfilSalvo = localStorage.getItem("portento_perfil") || "";
    const logadoSalvo = localStorage.getItem("portento_logado") === "sim";

    setUsuario(usuarioSalvo);
    setPerfil(perfilSalvo);
    setLogado(logadoSalvo);
  }, []);

  function sairDoSistema() {
    localStorage.removeItem("portento_logado");
    localStorage.removeItem("portento_usuario");
    localStorage.removeItem("portento_nome");
    localStorage.removeItem("portento_perfil");
    router.push("/login");
  }

  const links = [
    { label: "Início", href: "/" },
    { label: "CRM", href: "/crm" },
    { label: "Minhas Tarefas", href: "/agenda" },
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

              {logado ? (
                <>
                  <div className="ml-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                    {usuario || "Usuário"} {perfil ? `• ${perfil}` : ""}
                  </div>

                  <button
                    onClick={sairDoSistema}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                  >
                    Sair
                  </button>
                </>
              ) : null}
            </nav>
          </div>
        </header>

        {children}
      </body>
    </html>
  );
}