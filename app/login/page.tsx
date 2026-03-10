"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrarNoSistema(e?: React.FormEvent) {
    e?.preventDefault();
    setErro("");

    if (!usuario.trim() || !senha.trim()) {
      setErro("Preencha usuário e senha.");
      return;
    }

    setCarregando(true);

    try {
      const usuarioNormalizado = usuario
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("usuario", usuarioNormalizado)
        .eq("senha", senha.trim())
        .eq("ativo", true)
        .limit(1)
        .maybeSingle();

      if (error) {
        setErro("Erro ao consultar o banco.");
        setCarregando(false);
        return;
      }

      if (!data) {
        setErro("Usuário ou senha inválidos.");
        setCarregando(false);
        return;
      }

      localStorage.setItem("portento_logado", "sim");
      localStorage.setItem("portento_usuario", data.usuario);
      localStorage.setItem("portento_nome", data.nome);
      localStorage.setItem("portento_perfil", data.perfil);

      router.push("/painel");
    } catch (e) {
      console.error(e);
      setErro("Erro ao entrar no sistema.");
      setCarregando(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 md:px-8">
      <div className="mx-auto max-w-md">
        <div className="rounded-3xl bg-slate-900 p-8 text-white shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-300">
            Portento Construtora
          </p>

          <h1 className="mt-4 text-3xl font-bold">
            Acesso ao Sistema Comercial
          </h1>

          <p className="mt-3 text-sm text-slate-200">
            Entre com seu usuário e senha para acessar o sistema.
          </p>

          <form onSubmit={entrarNoSistema} className="mt-8 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Usuário
              </label>
              <input
                type="text"
                placeholder="Digite seu usuário"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-slate-300 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Senha
              </label>
              <input
                type="password"
                placeholder="Digite sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-slate-300 outline-none"
              />
            </div>

            {erro ? (
              <p className="text-sm font-medium text-red-300">{erro}</p>
            ) : null}

            <button
              type="submit"
              disabled={carregando}
              className="w-full rounded-xl bg-amber-400 px-4 py-3 font-semibold text-slate-900 transition hover:bg-amber-300 disabled:opacity-70"
            >
              {carregando ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>

        <div className="mt-4 text-center">
          <Link
            href="/"
            className="text-sm font-semibold text-slate-700 hover:text-slate-900"
          >
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    </main>
  );
}