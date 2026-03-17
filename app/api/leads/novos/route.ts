// app/api/leads/novos/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase"; // ajuste o caminho se necessário

export async function GET() {
  try {
    // Buscar leads novos (primeiro_contato = false e status_lead = 'Novo')
    const { data, error } = await supabase
      .from("crm_leads")
      .select(`
        id,
        nome,
        telefone,
        campanha,
        empreendimento,
        data_chegada,
        gestor,
        status_lead,
        primeiro_contato
      `)
      .eq("primeiro_contato", false)
      .eq("status_lead", "Novo")
      .order("data_chegada", { ascending: true })
      .limit(200);

    if (error) {
      console.error("Erro ao buscar leads novos:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Mapear / formatar data_chegada para ISO (opcional)
    const resultado = (data || []).map((l: any) => ({
      id: l.id,
      nome: l.nome,
      telefone: l.telefone,
      campanha: l.campanha || l.empreendimento || null,
      data_chegada: l.data_chegada,
      gestor: l.gestor,
      status_lead: l.status_lead,
      primeiro_contato: l.primeiro_contato,
    }));

    return NextResponse.json(resultado);
  } catch (err: any) {
    console.error("Erro inesperado GET /api/leads/novos", err);
    return NextResponse.json({ error: "Erro inesperado" }, { status: 500 });
  }
}