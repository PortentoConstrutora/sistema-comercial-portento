import { NextResponse } from "next/server";
import { importarLeadDaBaseGeral } from "../../lib/importacao-base-geral";
import { supabase } from "../../lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      id_lead,
      data_entrada,
      nome,
      telefone,
      empreendimento,
      origem,
      campanha,
      etapa_funil,
      proxima_acao,
      prioridade,
      planilha_origem,
    } = body;

    if (!id_lead || !nome) {
      return NextResponse.json(
        {
          ok: false,
          mensagem: "Campos obrigatórios ausentes: id_lead e nome.",
        },
        { status: 400 }
      );
    }

    const resultado = await importarLeadDaBaseGeral({
      id_lead,
      data_entrada,
      nome,
      telefone,
      empreendimento,
      origem,
      campanha,
      etapa_funil,
      proxima_acao,
      prioridade,
      planilha_origem,
    });

    if (!resultado.ok) {
      return NextResponse.json(resultado, { status: 200 });
    }

    const { data: leadCriado } = await supabase
      .from("crm_leads")
      .select("id, id_lead, gestor")
      .eq("id_lead", id_lead)
      .maybeSingle();

    return NextResponse.json({
      ok: true,
      mensagem: resultado.mensagem,
      gestor: leadCriado?.gestor || "",
      id_lead,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        ok: false,
        mensagem: "Erro interno ao importar lead da Base Geral.",
      },
      { status: 500 }
    );
  }
}