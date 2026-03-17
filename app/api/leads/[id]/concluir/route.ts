// app/api/leads/[id]/concluir/route.ts (versão mais tolerante)
import { NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

// Tipagem do body
type Body = {
  contatoSucesso?: boolean;
  observacao?: string;
  criarRetorno?: boolean;
  diasRetorno?: number;
  dataRetorno?: string;
};

function parseIdFromParamsOrUrl(params: any, req: Request): number | null {
  // 1) Tentativa direta do params (padrão App Router)
  if (params && params.id) {
    const idNum = Number(params.id);
    if (!Number.isNaN(idNum) && idNum > 0) return idNum;
  }

  // 2) Tentar extrair da URL (caso params não esteja presente)
  try {
    const u = new URL(req.url);
    const parts = u.pathname.split("/").filter(Boolean); // remove vazios
    // Procurar trecho 'leads' e pegar o próximo (id) se existir
    const idx = parts.findIndex((p) => p === "leads");
    if (idx >= 0 && parts.length > idx + 1) {
      const maybeId = Number(parts[idx + 1]);
      if (!Number.isNaN(maybeId) && maybeId > 0) return maybeId;
    }
  } catch (e) {
    // ignore
  }

  return null;
}

export async function POST(req: Request, context?: any) {
  try {
    // context?.params pode ser undefined dependendo da versão/estrutura
    const params = context?.params ?? {};
    const idLead = parseIdFromParamsOrUrl(params, req);

    if (!idLead) {
      return NextResponse.json({ error: "ID do lead inválido" }, { status: 400 });
    }

    const rawBody = await req.text().catch(() => "");
    let body: Body = {};
    if (rawBody) {
      try {
        body = JSON.parse(rawBody);
      } catch (e) {
        // se body não for JSON válido, ignora e usa defaults
        body = {};
      }
    }

    const contatoSucesso = body.contatoSucesso ?? true;
const observacao = body.observacao ?? "";
const criarRetorno = body.criarRetorno ?? true;
const diasRetorno = body.diasRetorno ?? 2;
const dataRetorno = body.dataRetorno ?? "";

    // identificar usuário (dev: x-usuario header; em produção use auth)
    const usuario =
      (req.headers && (req.headers.get("x-usuario") || req.headers.get("x-user"))) ||
      "sistema";

    // 1) Atualizar lead: marcar primeiro_contato e ultima_atualizacao
   const { error: leadError } = await supabase
  .from("crm_leads")
  .update({
    primeiro_contato: true,
    status_lead: "Em andamento",
    etapa_funil: "Primeiro Contato",
    proxima_acao: contatoSucesso ? "Fazer retorno" : "Nova tentativa de contato",
    ultima_atualizacao: new Date().toISOString(),
  })
  .eq("id", idLead);

    if (leadError) {
      console.error("Erro atualizando lead:", leadError);
      return NextResponse.json({ error: leadError.message }, { status: 500 });
    }

    // 2) Gravar histórico
 const descricao = `${
  contatoSucesso ? "Contato inicial: sucesso." : "Tentativa de contato."
} Lead atualizado para status "Em andamento", etapa "Primeiro Contato" e próxima ação "${
  contatoSucesso ? "Fazer retorno" : "Nova tentativa de contato"
}". ${observacao ? `Observação: ${observacao}` : ""}`;

    const { error: histError } = await supabase.from("crm_historico").insert({
      lead_id: idLead,
      usuario,
      tipo_evento: "contato_inicial",
      descricao,
      meta: { contatoSucesso },
      created_at: new Date().toISOString(),
    });

    if (histError) {
      console.error("Erro ao gravar histórico:", histError);
      // seguem mesmo assim
    }

    let tarefaCriada = null;

    // 3) Criar tarefa de retorno (evitar duplicação)
    if (criarRetorno) {
      const { data: existing, error: existErr } = await supabase
        .from("crm_tarefas")
        .select("id")
        .eq("lead_id", idLead)
        .eq("tipo", "Retorno")
        .eq("status", "Pendente")
        .limit(1)
        .maybeSingle();

      if (existErr) {
        console.error("Erro checando tarefas existentes:", existErr);
      }

      if (!existing) {
        const { data: leadRow, error: leadRowErr } = await supabase
          .from("crm_leads")
          .select("gestor")
          .eq("id", idLead)
          .maybeSingle();

        if (leadRowErr) {
          console.error("Erro obtendo gestor do lead:", leadRowErr);
        }

        const gestor = (leadRow && leadRow.gestor) || usuario;

        let prazo: Date;

if (dataRetorno) {
  prazo = new Date(`${dataRetorno}T09:00:00`);
} else {
  prazo = new Date();
  prazo.setDate(prazo.getDate() + diasRetorno);
}

        const { data: tarefaData, error: tarefaErr } = await supabase
          .from("crm_tarefas")
          .insert({
            lead_id: idLead,
            tipo: "Retorno",
            status: "Pendente",
            prazo: prazo.toISOString(),
            observacao: `Retorno automático criado após contato inicial. ${observacao}`,
            gestor,
            prioridade: "Média",
            criado_em: new Date().toISOString(),
          })
          .select()
          .maybeSingle();

        if (tarefaErr) {
          console.error("Erro criando tarefa:", tarefaErr);
        } else {
          tarefaCriada = tarefaData;

          // 4) Criar notificação in-app
          const notifPayload = {
            usuario: gestor,
            type: "tarefa_nova",
            data: { tarefaId: tarefaCriada.id, leadId: idLead },
            read: false,
            created_at: new Date().toISOString(),
          };

          const { error: notifErr } = await supabase.from("notifications").insert(notifPayload);
          if (notifErr) {
            console.error("Erro criando notificação:", notifErr);
          }
        }
      } else {
        tarefaCriada = { notice: "tarefa_existe", tarefaId: existing.id };
      }
    }

    return NextResponse.json({ sucesso: true, tarefa: tarefaCriada });
  } catch (err: any) {
    console.error("Erro inesperado POST /api/leads/:id/concluir", err);
    return NextResponse.json({ error: "Erro inesperado" }, { status: 500 });
  }
}