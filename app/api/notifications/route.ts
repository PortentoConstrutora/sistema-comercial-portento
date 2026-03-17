// app/api/notifications/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

export async function GET(req: Request) {
  try {
    // pegar usuario do header x-usuario (dev). Em produção, use auth/session.
    const usuario = req.headers.get("x-usuario") || "";

    if (!usuario) {
      return NextResponse.json({ error: "Usuário não informado" }, { status: 401 });
    }

    // Query: primeiro notificações não lidas, depois últimas lidas
    const { data, error } = await supabase
      .from("notifications")
      .select("id, usuario, type, data, read, created_at")
      .eq("usuario", usuario)
      .order("read", { ascending: true }) // false (não lida) primeiro
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Erro buscando notifications:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Erro GET /api/notifications", err);
    return NextResponse.json({ error: "Erro inesperado" }, { status: 500 });
  }
}