// app/api/notifications/[id]/read/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params?.id);
    if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const usuario = req.headers.get("x-usuario") || "";
    if (!usuario) return NextResponse.json({ error: "Usuário não informado" }, { status: 401 });

    // Opcional: checar se a notificação pertence ao usuário
    const { data: notifCheck, error: checkErr } = await supabase
      .from("notifications")
      .select("id, usuario")
      .eq("id", id)
      .maybeSingle();

    if (checkErr) {
      console.error("Erro checando notificação:", checkErr);
      return NextResponse.json({ error: checkErr.message }, { status: 500 });
    }
    if (!notifCheck) return NextResponse.json({ error: "Notificação não encontrada" }, { status: 404 });
    if (notifCheck.usuario !== usuario) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);

    if (error) {
      console.error("Erro marcando notificação lida:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ sucesso: true });
  } catch (err: any) {
    console.error("Erro PATCH /api/notifications/[id]/read", err);
    return NextResponse.json({ error: "Erro inesperado" }, { status: 500 });
  }
}