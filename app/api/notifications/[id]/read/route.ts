// app/api/notifications/[id]/read/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const id = Number(rawId);

    if (!id) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const usuario = req.headers.get("x-usuario") || "";
    if (!usuario) {
      return NextResponse.json({ error: "Usuário não informado" }, { status: 401 });
    }

    const { data: notif, error: notifErr } = await supabase
      .from("notifications")
      .select("id, usuario, type, data, read, created_at")
      .eq("id", id)
      .maybeSingle();

    if (notifErr) {
      console.error("Erro checando notificação:", notifErr);
      return NextResponse.json({ error: notifErr.message }, { status: 500 });
    }

    if (!notif) {
      return NextResponse.json({ error: "Notificação não encontrada" }, { status: 404 });
    }

    if (notif.usuario !== usuario) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const { error: updateErr } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);

    if (updateErr) {
      console.error("Erro marcando notificação lida:", updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    const payload = notif.data ?? {};
    const leadId =
      payload?.leadId != null && !Number.isNaN(Number(payload.leadId))
        ? Number(payload.leadId)
        : null;

    if (leadId) {
      const { error: histErr } = await supabase.from("crm_historico").insert({
        lead_id: leadId,
        tipo_evento: "notificacao_visualizada",
        descricao: "Notificação visualizada pelo usuário",
        usuario,
        meta: payload,
      });

      if (histErr) {
        console.error("Erro gravando histórico da notificação:", histErr);
        return NextResponse.json({ error: histErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({ sucesso: true });
  } catch (err: any) {
    console.error("Erro PATCH /api/notifications/[id]/read", err);
    return NextResponse.json({ error: "Erro inesperado" }, { status: 500 });
  }
}