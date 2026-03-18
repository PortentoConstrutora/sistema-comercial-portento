"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type FechamentoItem = {
  id: number;
  lead_id: number | null;
  origem: string | null;
  gestor: string | null;
  cliente: string | null;
  telefone: string | null;
  produto: string | null;
  imobiliaria: string | null;
  corretor: string | null;
  data_primeiro_contato: string | null;
  status_fechamento: string | null;
  descricao_status: string | null;
  data_status: string | null;
  proxima_acao: string | null;
  data_prevista_fechamento: string | null;
  valor_previsto: number | null;
  valor_fechado: number | null;
  data_fechamento: string | null;
  observacao: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type FormFechamento = {
  lead_id: string;
  cliente: string;
  telefone: string;
  produto: string;
  imobiliaria: string;
  corretor: string;
  data_primeiro_contato: string;
  status_fechamento: string;
  descricao_status: string;
  data_status: string;
  proxima_acao: string;
  data_prevista_fechamento: string;
  valor_previsto: string;
  valor_fechado: string;
  data_fechamento: string;
  observacao: string;
};

function formatarDataBR(data: string | null) {
  if (!data) return "-";
  return new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR");
}

function formatarMesAno(valor: string) {
  const [ano, mes] = valor.split("-").map(Number);
  return new Date(ano, mes - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function formatarMoeda(valor: number | null) {
  if (valor === null || valor === undefined) return "-";
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function FechamentosPage() {
  const router = useRouter();

  const [perfil, setPerfil] = useState("");
  const [usuarioLogado, setUsuarioLogado] = useState("");
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [modoEdicao, setModoEdicao] = useState(false);
  const [fechamentoEditandoId, setFechamentoEditandoId] = useState<number | null>(null);

  const hoje = new Date();
  const [mesSelecionado, setMesSelecionado] = useState(
    `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`
  );

  const [fechamentos, setFechamentos] = useState<FechamentoItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [buscaLead, setBuscaLead] = useState("");
const [leadsEncontrados, setLeadsEncontrados] = useState<any[]>([]);
const [buscandoLeads, setBuscandoLeads] = useState(false);

  const formularioInicial: FormFechamento = {
    lead_id: "",
    cliente: "",
    telefone: "",
    produto: "",
    imobiliaria: "",
    corretor: "",
    data_primeiro_contato: "",
    status_fechamento: "Em andamento",
    descricao_status: "",
    data_status: "",
    proxima_acao: "",
    data_prevista_fechamento: "",
    valor_previsto: "",
    valor_fechado: "",
    data_fechamento: "",
    observacao: "",
  };

  const [formulario, setFormulario] = useState<FormFechamento>(formularioInicial);

  useEffect(() => {
    const logado = localStorage.getItem("portento_logado");
    const perfilSalvo = localStorage.getItem("portento_perfil");
    const usuario = localStorage.getItem("portento_usuario");
    const nome = localStorage.getItem("portento_nome");

    if (logado !== "sim") {
      router.push("/login");
      return;
    }

    setPerfil(perfilSalvo || "");
    setUsuarioLogado((usuario || "").toLowerCase());
    setNomeUsuario(nome || "");
  }, [router]);

  async function excluirFechamento(id: number) {
  const confirmou = window.confirm("Deseja excluir este fechamento?");

  if (!confirmou) return;

  const { error } = await supabase
    .from("crm_fechamentos")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("Erro ao excluir fechamento.");
    return;
  }

  await carregarFechamentos();
}
  async function carregarFechamentos() {
    setCarregando(true);

    const { data, error } = await supabase
      .from("crm_fechamentos")
      .select("*")
      .order("data_status", { ascending: false })
      .order("id", { ascending: false });

    if (error) {
      console.error(error);
      setFechamentos([]);
      setCarregando(false);
      return;
    }

    setFechamentos((data || []) as FechamentoItem[]);
    setCarregando(false);
  }

  useEffect(() => {
    carregarFechamentos();
  }, []);

  const fechamentosDoMes = useMemo(() => {
    return fechamentos.filter((item) => {
      const dataBase =
        item.data_status ||
        item.data_primeiro_contato ||
        item.data_fechamento ||
        "";

      const matchMes = dataBase.startsWith(mesSelecionado);

      const matchGestor =
        perfil !== "gestor" ||
        (item.gestor || "").toLowerCase() === usuarioLogado;

      return matchMes && matchGestor;
    });
  }, [fechamentos, mesSelecionado, perfil, usuarioLogado]);

  const totalMes = fechamentosDoMes.length;

  const totalEmAndamento = fechamentosDoMes.filter(
    (item) => (item.status_fechamento || "").toLowerCase() === "em andamento"
  ).length;

  const totalFechados = fechamentosDoMes.filter(
    (item) => (item.status_fechamento || "").toLowerCase() === "fechado"
  ).length;

  const totalPerdidos = fechamentosDoMes.filter(
    (item) => (item.status_fechamento || "").toLowerCase() === "perdido"
  ).length;

  function mudarMes(direcao: "anterior" | "proximo") {
    const [ano, mes] = mesSelecionado.split("-").map(Number);
    const base = new Date(ano, mes - 1, 1);

    if (direcao === "anterior") {
      base.setMonth(base.getMonth() - 1);
    } else {
      base.setMonth(base.getMonth() + 1);
    }

    setMesSelecionado(
      `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}`
    );
  }

  function abrirNovoFechamento() {
    setModoEdicao(false);
    setFechamentoEditandoId(null);
    setFormulario({
      ...formularioInicial,
      data_status: new Date().toISOString().slice(0, 10),
    });
    setBuscaLead("");
setLeadsEncontrados([]);
    setModalAberto(true);
  }

  function fecharModal() {
    if (salvando) return;
    setModalAberto(false);
    setModoEdicao(false);
    setBuscaLead("");
setLeadsEncontrados([]);
    setFechamentoEditandoId(null);
    setFormulario(formularioInicial);
  }

  function atualizarCampo(campo: keyof FormFechamento, valor: string) {
  setFormulario((atual) => ({
    ...atual,
    [campo]: valor,
  }));
}

async function buscarLeads() {
  if (!buscaLead.trim()) {
    alert("Digite nome, telefone ou produto para buscar.");
    return;
  }

  setBuscandoLeads(true);

  const termo = buscaLead.trim();

  const { data, error } = await supabase
    .from("crm_leads")
    .select("id, nome, telefone, empreendimento, gestor")
    .or(
      `nome.ilike.%${termo}%,telefone.ilike.%${termo}%,empreendimento.ilike.%${termo}%`
    )
    .order("id", { ascending: false })
    .limit(8);

  setBuscandoLeads(false);

  if (error) {
    console.error(error);
    alert("Erro ao buscar leads.");
    return;
  }

  setLeadsEncontrados(data || []);
}

function selecionarLead(lead: {
  id: number;
  nome: string | null;
  telefone: string | null;
  empreendimento: string | null;
  gestor: string | null;
}) {
  setFormulario((atual) => ({
    ...atual,
    lead_id: String(lead.id),
    cliente: lead.nome || "",
    telefone: lead.telefone || "",
    produto: lead.empreendimento || "",
  }));

  setLeadsEncontrados([]);
  setBuscaLead(lead.nome || "");
}

  function abrirEdicao(item: FechamentoItem) {
    setModoEdicao(true);
    setFechamentoEditandoId(item.id);
    setFormulario({
      lead_id: item.lead_id ? String(item.lead_id) : "",
      cliente: item.cliente || "",
      telefone: item.telefone || "",
      produto: item.produto || "",
      imobiliaria: item.imobiliaria || "",
      corretor: item.corretor || "",
      data_primeiro_contato: item.data_primeiro_contato || "",
      status_fechamento: item.status_fechamento || "Em andamento",
      descricao_status: item.descricao_status || "",
      data_status: item.data_status || "",
      proxima_acao: item.proxima_acao || "",
      data_prevista_fechamento: item.data_prevista_fechamento || "",
      valor_previsto:
        item.valor_previsto !== null && item.valor_previsto !== undefined
          ? String(item.valor_previsto)
          : "",
      valor_fechado:
        item.valor_fechado !== null && item.valor_fechado !== undefined
          ? String(item.valor_fechado)
          : "",
      data_fechamento: item.data_fechamento || "",
      observacao: item.observacao || "",
    });
    setBuscaLead("");
setLeadsEncontrados([]);
    setModalAberto(true);
  }

  async function salvarFechamento(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!formulario.cliente.trim()) {
      alert("Preencha o nome do cliente.");
      return;
    }

    setSalvando(true);

    const payload = {
      lead_id: formulario.lead_id ? Number(formulario.lead_id) : null,
      origem: "manual",
      gestor: usuarioLogado || nomeUsuario || null,
      cliente: formulario.cliente.trim() || null,
      telefone: formulario.telefone.trim() || null,
      produto: formulario.produto.trim() || null,
      imobiliaria: formulario.imobiliaria.trim() || null,
      corretor: formulario.corretor.trim() || null,
      data_primeiro_contato: formulario.data_primeiro_contato || null,
      status_fechamento: formulario.status_fechamento || "Em andamento",
      descricao_status: formulario.descricao_status.trim() || null,
      data_status: formulario.data_status || null,
      proxima_acao: formulario.proxima_acao.trim() || null,
      data_prevista_fechamento: formulario.data_prevista_fechamento || null,
      valor_previsto: formulario.valor_previsto
        ? Number(formulario.valor_previsto.replace(",", "."))
        : null,
      valor_fechado: formulario.valor_fechado
        ? Number(formulario.valor_fechado.replace(",", "."))
        : null,
      data_fechamento: formulario.data_fechamento || null,
      observacao: formulario.observacao.trim() || null,
      updated_at: new Date().toISOString(),
    };

    let error = null;

    if (modoEdicao && fechamentoEditandoId) {
      const resposta = await supabase
        .from("crm_fechamentos")
        .update(payload)
        .eq("id", fechamentoEditandoId);

      error = resposta.error;
    } else {
      const resposta = await supabase.from("crm_fechamentos").insert(payload);
      error = resposta.error;
    }

    if (error) {
      console.error(error);
      alert(modoEdicao ? "Erro ao atualizar fechamento." : "Erro ao salvar fechamento.");
      setSalvando(false);
      return;
    }

    await carregarFechamentos();
    setSalvando(false);
    setModalAberto(false);
    setModoEdicao(false);
    setFechamentoEditandoId(null);
    setFormulario(formularioInicial);
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-600">
                Módulo
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">
                Fechamentos
              </h1>
              <p className="mt-2 text-slate-600">
                Acompanhamento de vendas do gestor
                {nomeUsuario ? ` • ${nomeUsuario}` : ""}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => mudarMes("anterior")}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                ←
              </button>

              <input
                type="month"
                value={mesSelecionado}
                onChange={(e) => setMesSelecionado(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              />

              <button
                onClick={() => mudarMes("proximo")}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                →
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total no mês</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{totalMes}</p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Em andamento</p>
            <p className="mt-2 text-3xl font-bold text-amber-600">
              {totalEmAndamento}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Fechados</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {totalFechados}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Perdidos</p>
            <p className="mt-2 text-3xl font-bold text-rose-600">
              {totalPerdidos}
            </p>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Fechamentos de {formatarMesAno(mesSelecionado)}
              </h2>
              <p className="text-sm text-slate-500">
                O gestor vê apenas os próprios registros.
              </p>
            </div>

            <button
              onClick={abrirNovoFechamento}
              className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
            >
              + Novo fechamento
            </button>
          </div>

          {carregando ? (
            <p className="py-10 text-center text-slate-500">Carregando...</p>
          ) : fechamentosDoMes.length === 0 ? (
            <p className="py-10 text-center text-slate-500">
              Nenhum fechamento encontrado neste mês.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0 text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-700">
                      Cliente
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-700">
                      Produto
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-700">
                      Corretor
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-700">
                      Imobiliária
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-700">
                      Status
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-700">
                      Data status
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-700">
                      Valor previsto
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-700">
                      Observação
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-700">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {fechamentosDoMes.map((item) => (
                    <tr key={item.id} className="align-top">
                      <td className="border-b border-slate-100 px-4 py-3 text-slate-800">
                        {item.cliente || "-"}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3 text-slate-800">
                        {item.produto || "-"}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3 text-slate-800">
                        {item.corretor || "-"}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3 text-slate-800">
                        {item.imobiliaria || "-"}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3 text-slate-800">
                        {item.status_fechamento || "-"}
                        {item.descricao_status ? (
                          <p className="mt-1 text-xs text-slate-500">
                            {item.descricao_status}
                          </p>
                        ) : null}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3 text-slate-800">
                        {formatarDataBR(item.data_status)}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3 text-slate-800">
                        {formatarMoeda(item.valor_previsto)}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3 text-slate-800">
                        {item.observacao || "-"}
                      </td>
                     <td className="border-b border-slate-100 px-4 py-3 text-slate-800">
  <div className="flex flex-wrap gap-2">
    <button
      onClick={() => abrirEdicao(item)}
      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
    >
      Editar
    </button>

    <button
      onClick={() => excluirFechamento(item.id)}
      className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
    >
      Excluir
    </button>
  </div>
</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
                  {modoEdicao ? "Editar registro" : "Novo registro"}
                </p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {modoEdicao ? "Editar fechamento" : "Novo fechamento"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {modoEdicao
                    ? "Atualize as informações do acompanhamento comercial."
                    : "Cadastro manual do acompanhamento comercial."}
                </p>
              </div>

              <button
                onClick={fecharModal}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={salvarFechamento} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
<div className="md:col-span-2">
  <label className="mb-1 block text-sm font-semibold text-slate-700">
    Vincular lead
  </label>

  <div className="flex flex-col gap-2 md:flex-row">
    <input
      type="text"
      value={buscaLead}
      onChange={(e) => setBuscaLead(e.target.value)}
      placeholder="Buscar por nome, telefone ou produto"
      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-500"
    />

    <button
      type="button"
      onClick={buscarLeads}
      className="whitespace-nowrap rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
    >
      {buscandoLeads ? "Buscando..." : "Buscar lead"}
    </button>
  </div>

  {formulario.lead_id ? (
    <p className="mt-2 text-xs text-emerald-600">
      Lead vinculado: ID {formulario.lead_id}
    </p>
  ) : null}

  {leadsEncontrados.length > 0 ? (
    <div className="mt-3 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
      {leadsEncontrados.map((lead) => (
        <button
          key={lead.id}
          type="button"
          onClick={() => selecionarLead(lead)}
          className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left hover:bg-amber-50"
        >
          <p className="font-semibold text-slate-800">
            {lead.nome || "Sem nome"}
          </p>
          <p className="text-sm text-slate-500">
            Tel: {lead.telefone || "-"} • Produto: {lead.empreendimento || "-"}
          </p>
          <p className="text-xs text-slate-400">
            ID {lead.id} • Gestor: {lead.gestor || "-"}
          </p>
        </button>
      ))}
    </div>
  ) : null}
</div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Cliente *
                  </label>
                  <input
                    type="text"
                    value={formulario.cliente}
                    onChange={(e) => atualizarCampo("cliente", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={formulario.telefone}
                    onChange={(e) => atualizarCampo("telefone", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Produto
                  </label>
                  <input
                    type="text"
                    value={formulario.produto}
                    onChange={(e) => atualizarCampo("produto", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Imobiliária
                  </label>
                  <input
                    type="text"
                    value={formulario.imobiliaria}
                    onChange={(e) => atualizarCampo("imobiliaria", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Corretor
                  </label>
                  <input
                    type="text"
                    value={formulario.corretor}
                    onChange={(e) => atualizarCampo("corretor", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Status
                  </label>
                  <select
                    value={formulario.status_fechamento}
                    onChange={(e) => atualizarCampo("status_fechamento", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-500"
                  >
                    <option>Em andamento</option>
                    <option>Visita realizada</option>
                    <option>Proposta enviada</option>
                    <option>Em negociação</option>
                    <option>Aguardando cliente</option>
                    <option>Fechado</option>
                    <option>Perdido</option>
                    <option>Cancelado</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Data primeiro contato
                  </label>
                  <input
                    type="date"
                    value={formulario.data_primeiro_contato}
                    onChange={(e) => atualizarCampo("data_primeiro_contato", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Data do status
                  </label>
                  <input
                    type="date"
                    value={formulario.data_status}
                    onChange={(e) => atualizarCampo("data_status", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Previsão de fechamento
                  </label>
                  <input
                    type="date"
                    value={formulario.data_prevista_fechamento}
                    onChange={(e) =>
                      atualizarCampo("data_prevista_fechamento", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Data do fechamento
                  </label>
                  <input
                    type="date"
                    value={formulario.data_fechamento}
                    onChange={(e) => atualizarCampo("data_fechamento", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Valor previsto
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formulario.valor_previsto}
                    onChange={(e) => atualizarCampo("valor_previsto", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Valor fechado
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formulario.valor_fechado}
                    onChange={(e) => atualizarCampo("valor_fechado", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Descrição do status
                </label>
                <textarea
                  rows={3}
                  value={formulario.descricao_status}
                  onChange={(e) => atualizarCampo("descricao_status", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Próxima ação
                </label>
                <textarea
                  rows={2}
                  value={formulario.proxima_acao}
                  onChange={(e) => atualizarCampo("proxima_acao", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Observação
                </label>
                <textarea
                  rows={3}
                  value={formulario.observacao}
                  onChange={(e) => atualizarCampo("observacao", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 md:flex-row md:justify-end">
                <button
                  type="button"
                  onClick={fecharModal}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={salvando}
                  className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {salvando ? "Salvando..." : modoEdicao ? "Salvar alterações" : "Salvar fechamento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}