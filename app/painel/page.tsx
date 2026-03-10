"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PainelPage() {
  const router = useRouter();

  useEffect(() => {
    const logado = localStorage.getItem("portento_logado");
    const perfil = localStorage.getItem("portento_perfil");

    if (logado !== "sim") {
      router.push("/login");
      return;
    }

    if (perfil === "gestor") {
      router.push("/gestor");
      return;
    }

    if (perfil === "diretoria") {
      router.push("/diretoria");
      return;
    }

    if (perfil === "admin") {
      router.push("/admin");
      return;
    }

    router.push("/login");
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          Redirecionando...
        </h1>
        <p className="mt-3 text-slate-600">
          Aguarde enquanto carregamos sua área.
        </p>
      </div>
    </main>
  );
}