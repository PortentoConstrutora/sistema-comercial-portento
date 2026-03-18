"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type DiarioItem = {
  id: number;
  lead_id: number | null;
  tarefa_id: number | null;
  agenda_id: number | null;
  origem: string | null;
  data_registro: string;
  hora_registro: string | null;
  gestor: string | null;
  cliente: string | null;
  telefone: string | null;
  produto: string | null;
  imobiliaria: string | null;
  corretor: string | null;
  tipo_atividade: string | null;
  resultado: string | null;
  observacao: string | null;
  created_at: string | null;
};

type NovoRegistro = {
  data_registro: string;
  cliente: string;
  produto: string;
  hora_registro: string;
  imobiliaria: string;
  corretor: string;
  tipo_atividade: string;
  resultado: string;
  observacao: string;
};

function formatarDataBR(data: string) {
  return new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR");
}

function nomeDiaSemana(data: string) {
  return new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR", {
    weekday: "long",
  });
}

function gerarDiasDoMes(ano: number, mesIndex: number) {
  const totalDias = new Date(ano, mesIndex + 1, 0).getDate();
  const dias: string[] = [];

  for (let dia = 1; dia <= totalDias; dia += 1) {
    const data = new Date(ano, mesIndex, dia);
    const yyyy = data.getFullYear();
    const mm = String(data.getMonth() + 1).padStart(2, "0");
    const dd = String(data.getDate()).padStart(2, "0");
    dias.push(`${yyyy}-${mm}-${dd}`);
  }

  return dias;
}

export default function DiarioPage() {
  const router = useRouter();

  const [nomeUsuario, setNomeUsuario] = useState("");
  const [perfil, setPerfil] = useState("");
  const [usuarioLogado, setUsuarioLogado] = useState("");

  const hoje = new Date();
  const [mesSelecionado, setMesSelecionado] = useState(
    `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`
  );

  const [registros, setRegistros] = useState<DiarioItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [dataModalAberto, setDataModalAberto] = useState<string | null>(null);

  const [novoRegistro, setNovoRegistro] = useState<NovoRegistro>({
    data_registro: "",
    cliente: "",
    produto: "",
    hora_registro: "",
    imobiliaria: "",
    corretor: "",
    tipo_atividade: "Atendimento ao Cliente",
    resultado: "",
    observacao: "",
  });

  useEffect(() => {
    const logado = localStorage.getItem("portento_logado");
    const nome = localStorage.getItem("portento_nome");
    const perfilSalvo = localStorage.getItem("portento_perfil");
    const usuario = localStorage.getItem("portento_usuario");

    if (logado !== "sim") {
      router.push("/login");
      return;
    }

    setNomeUsuario(nome || "");
    setPerfil(perfilSalvo || "");
    setUsuarioLogado((usuario || "").toLowerCase());
  }, [router]);

  async function carregarDiario() {
    setCarregando(true);

    const { data, error } = await supabase
      .from("crm_diario_bordo")
      .select("*")
      .order("data_registro", { ascending: true })
      .order("hora_registro", { ascending: true })
      .order("id", { ascending: true });

    if (error) {
      console.error(error);
      setRegistros([]);
      setCarregando(false);
      return;
    }

    setRegistros(data || []);
    setCarregando(false);
  }

  useEffect(() => {
    carregarDiario();
  }, []);

  const [anoSelecionado, mesNumero] = mesSelecionado.split("-").map(Number);
  const mesIndex = mesNumero - 1;
  const diasDoMes = useMemo(
    () => gerarDiasDoMes(anoSelecionado, mesIndex),
    [anoSelecionado, mesIndex]
  );

  const registrosDoMes = useMemo(() => {
    return registros.filter((item) => {
      const matchMes = item.data_registro.startsWith(mesSelecionado);

      const matchGestor =
        perfil !== "gestor" ||
        (item.gestor || "").toLowerCase() === usuarioLogado;

      return matchMes && matchGestor;
    });
  }, [registros, mesSelecionado, perfil, usuarioLogado]);

  const totalMes = registrosDoMes.length;
  const totalVisitas = registrosDoMes.filter((item) =>
    (item.tipo_atividade || "").toLowerCase().includes("visita")
  ).length;
  const totalAtendimentos = registrosDoMes.filter(
    (item) => item.tipo_atividade === "Atendimento ao Cliente"
  ).length;
  const totalLigacoes = registrosDoMes.filter(
    (item) => item.tipo_atividade === "Ligações Leads"
  ).length;

  const mapaPorDia = useMemo(() => {
    const mapa: Record<string, DiarioItem[]> = {};

    for (const dia of diasDoMes) {
      mapa[dia] = [];
    }

    for (const item of registrosDoMes) {
      if (!mapa[item.data_registro]) {
        mapa[item.data_registro] = [];
      }
      mapa[item.data_registro].push(item);
    }

    return mapa;
  }, [diasDoMes, registrosDoMes]);

  function abrirModalNovoRegistro(data: string) {
    setDataModalAberto(data);
    setNovoRegistro({
      data_registro: data,
      cliente: "",
      produto: "",
      hora_registro: "",
      imobiliaria: "",
      corretor: "",
      tipo_atividade: "Atendimento ao Cliente",
      resultado: "",
      observacao: "",
    });
  }

  function fecharModalNovoRegistro() {
    setDataModalAberto(null);
    setNovoRegistro({
      data_registro: "",
      cliente: "",
      produto: "",
      hora_registro: "",
      imobiliaria: "",
      corretor: "",
      tipo_atividade: "Atendimento ao Cliente",
      resultado: "",
      observacao: "",
    });
  }

  async function salvarNovoRegistro() {
    if (!novoRegistro.data_registro) {
      alert("Data do registro não informada.");
      return;
    }

    if (!novoRegistro.cliente.trim() && !novoRegistro.observacao.trim()) {
      alert("Preencha pelo menos Cliente/Atividade ou Observação.");
      return;
    }

    setSalvando(true);

    const usuarioAtual = localStorage.getItem("portento_usuario") || "";

    const { error } = await supabase.from("crm_diario_bordo").insert({
      lead_id: null,
      tarefa_id: null,
      agenda_id: null,
      origem: "manual",
      data_registro: novoRegistro.data_registro,
      hora_registro: novoRegistro.hora_registro || null,
      gestor: usuarioAtual,
      cliente: novoRegistro.cliente.trim() || null,
      telefone: null,
      produto: novoRegistro.produto.trim() || null,
      imobiliaria: novoRegistro.imobiliaria.trim() || null,
      corretor: novoRegistro.corretor.trim() || null,
      tipo_atividade: novoRegistro.tipo_atividade,
      resultado: novoRegistro.resultado.trim() || null,
      observacao: novoRegistro.observacao.trim() || null,
    });

    if (error) {
      console.error(error);
      alert("Erro ao salvar atividade no Diário de Bordo.");
      setSalvando(false);
      return;
    }

    await carregarDiario();
    setSalvando(false);
    fecharModalNovoRegistro();
  }

  async function excluirRegistro(id: number) {
    const confirmar = window.confirm("Deseja excluir esta atividade do Diário?");
    if (!confirmar) return;

    const { error } = await supabase.from("crm_diario_bordo").delete().eq("id", id);

    if (error) {
      console.error(error);
      alert("Erro ao excluir atividade.");
      return;
    }

    await carregarDiario();
  }

  function mudarMes(direcao: "anterior" | "proximo") {
    const [ano, mes] = mesSelecionado.split("-").map(Number);
    const base = new Date(ano, mes - 1, 1);

    if (direcao === "anterior") {
      base.setMonth(base.getMonth() - 1);
    } else {
      base.setMonth(base.getMonth() + 1);
    }

    const novoValor = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}`;
    setMesSelecionado(novoValor);
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="mb-8 rounded-3xl bg-slate-900 px-6 py-8 text-white shadow-xl md:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-300">
            CRM
          </p>

          <h1 className="mt-3 text-3xl font-bold md:text-5xl">
            Diário de Bordo
          </h1>

          <p className="mt-4 text-sm text-slate-200 md:text-base">
            Registro mensal das atividades comerciais realizadas no dia a dia.
          </p>

          <p className="mt-4 text-sm text-slate-300">
            Usuário logado: <strong>{nomeUsuario || "Carregando..."}</strong>
          </p>
        </section>

        <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Atividades no mês</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">{totalMes}</h2>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Visitas</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">{totalVisitas}</h2>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Atendimentos</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">{totalAtendimentos}</h2>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Ligações</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">{totalLigacoes}</h2>
          </div>
        </section>

        <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Mês do Diário
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => mudarMes("anterior")}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
                >
                  ←
                </button>

                <input
                  type="month"
                  value={mesSelecionado}
                  onChange={(e) => setMesSelecionado(e.target.value)}
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none"
                />

                <button
                  onClick={() => mudarMes("proximo")}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
                >
                  →
                </button>
              </div>
            </div>

            <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
              Visualizando: <strong>{mesSelecionado}</strong>
            </div>
          </div>
        </section>

        {carregando ? (
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-slate-600">Carregando Diário de Bordo...</p>
          </section>
        ) : (
          <section className="space-y-6">
            {diasDoMes.map((dia) => {
              const itensDia = mapaPorDia[dia] || [];

              return (
                <div key={dia} className="rounded-2xl bg-white p-5 shadow-sm">
                  <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        {formatarDataBR(dia)}
                      </h2>
                      <p className="text-sm capitalize text-slate-500">
                        {nomeDiaSemana(dia)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                        Atividades no dia: {itensDia.length}
                      </span>

                      <button
                        onClick={() => abrirModalNovoRegistro(dia)}
                        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                      >
                        + Adicionar atividade
                      </button>
                    </div>
                  </div>

                  {itensDia.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
                      Sem atividades neste dia.
                    </div>
                  ) : (
                    <div className="overflow-auto">
                      <table className="w-full min-w-[1200px] border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-left">
                            <th className="px-3 py-3 text-sm font-bold text-slate-700">Cliente/Atividade</th>
                            <th className="px-3 py-3 text-sm font-bold text-slate-700">Produto</th>
                            <th className="px-3 py-3 text-sm font-bold text-slate-700">Horário</th>
                            <th className="px-3 py-3 text-sm font-bold text-slate-700">Imob/Corretor</th>
                            <th className="px-3 py-3 text-sm font-bold text-slate-700">Tipo de Ação</th>
                            <th className="px-3 py-3 text-sm font-bold text-slate-700">Resultado</th>
                            <th className="px-3 py-3 text-sm font-bold text-slate-700">Origem</th>
                            <th className="px-3 py-3 text-sm font-bold text-slate-700">Ações</th>
                          </tr>
                        </thead>

                        <tbody>
                          {itensDia.map((item) => (
                            <tr key={item.id} className="border-b border-slate-100 align-top">
                              <td className="px-3 py-3 text-sm text-slate-700">
                                <div className="font-medium">{item.cliente || "-"}</div>
                                {item.observacao ? (
                                  <div className="mt-1 text-xs text-slate-500">
                                    {item.observacao}
                                  </div>
                                ) : null}
                              </td>

                              <td className="px-3 py-3 text-sm text-slate-700">
                                {item.produto || "-"}
                              </td>

                              <td className="px-3 py-3 text-sm text-slate-700">
                                {item.hora_registro || "-"}
                              </td>

                              <td className="px-3 py-3 text-sm text-slate-700">
                                <div>{item.imobiliaria || "-"}</div>
                                <div className="mt-1 text-xs text-slate-500">
                                  {item.corretor || "-"}
                                </div>
                              </td>

                              <td className="px-3 py-3 text-sm text-slate-700">
                                {item.tipo_atividade || "-"}
                              </td>

                              <td className="px-3 py-3 text-sm text-slate-700">
                                {item.resultado || "-"}
                              </td>

                              <td className="px-3 py-3 text-sm text-slate-700">
                                {item.origem || "-"}
                              </td>

                              <td className="px-3 py-3 text-sm text-slate-700">
                                <button
                                  onClick={() => excluirRegistro(item.id)}
                                  className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                                >
                                  Excluir
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        )}
      </div>

      {dataModalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900">
              Adicionar atividade
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Data selecionada: <strong>{formatarDataBR(dataModalAberto)}</strong>
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700">
                  Cliente/Atividade
                </label>
                <input
                  type="text"
                  value={novoRegistro.cliente}
                  onChange={(e) =>
                    setNovoRegistro((prev) => ({ ...prev, cliente: e.target.value }))
                  }
                  placeholder="Ex.: Escritório, Amburana, My Broker SM, cliente..."
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Produto
                </label>
                <input
                  type="text"
                  value={novoRegistro.produto}
                  onChange={(e) =>
                    setNovoRegistro((prev) => ({ ...prev, produto: e.target.value }))
                  }
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Horário
                </label>
                <input
                  type="time"
                  value={novoRegistro.hora_registro}
                  onChange={(e) =>
                    setNovoRegistro((prev) => ({ ...prev, hora_registro: e.target.value }))
                  }
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Imobiliária
                </label>
                <input
                  type="text"
                  value={novoRegistro.imobiliaria}
                  onChange={(e) =>
                    setNovoRegistro((prev) => ({ ...prev, imobiliaria: e.target.value }))
                  }
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Corretor
                </label>
                <input
                  type="text"
                  value={novoRegistro.corretor}
                  onChange={(e) =>
                    setNovoRegistro((prev) => ({ ...prev, corretor: e.target.value }))
                  }
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Tipo de Ação
                </label>
                <select
                  value={novoRegistro.tipo_atividade}
                  onChange={(e) =>
                    setNovoRegistro((prev) => ({ ...prev, tipo_atividade: e.target.value }))
                  }
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="Visita Cliente">Visita Cliente</option>
                  <option value="Visita Imobiliária">Visita Imobiliária</option>
                  <option value="Atendimento ao Cliente">Atendimento ao Cliente</option>
                  <option value="Ligações Leads">Ligações Leads</option>
                  <option value="Flow Up Corretores">Flow Up Corretores</option>
                  <option value="Reunião">Reunião</option>
                  <option value="Feirão">Feirão</option>
                  <option value="Ação de Rua">Ação de Rua</option>
                  <option value="Aprovação">Aprovação</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Resultado
                </label>
                <input
                  type="text"
                  value={novoRegistro.resultado}
                  onChange={(e) =>
                    setNovoRegistro((prev) => ({ ...prev, resultado: e.target.value }))
                  }
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700">
                  Observação
                </label>
                <textarea
                  value={novoRegistro.observacao}
                  onChange={(e) =>
                    setNovoRegistro((prev) => ({ ...prev, observacao: e.target.value }))
                  }
                  rows={4}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={fecharModalNovoRegistro}
                className="rounded-lg border px-4 py-2"
              >
                Cancelar
              </button>

              <button
                onClick={salvarNovoRegistro}
                className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
              >
                {salvando ? "Salvando..." : "Salvar atividade"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}