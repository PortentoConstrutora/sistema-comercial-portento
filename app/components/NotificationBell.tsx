// app/components/NotificationBell.tsx
"use client";

import { useEffect, useState } from "react";

type NotificationItem = {
  id: number;
  usuario: string;
  type: string;
  data: any;
  read: boolean;
  created_at: string;
};

export default function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const usuario = (typeof window !== "undefined" && localStorage.getItem("portento_usuario")) || "";

  useEffect(() => {
    if (!usuario) return;
    fetchNotifications();
    // opcional: poll a cada X segundos (ou usar websocket)
    // const t = setInterval(fetchNotifications, 30000);
    // return () => clearInterval(t);
  }, [usuario]);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications", { headers: { "x-usuario": usuario } });
      if (!res.ok) {
        console.error("Erro fetch notifications:", await res.text());
        return;
      }
      const json = await res.json();
      setItems(json || []);
    } catch (err) {
      console.error(err);
    }
  }

  function unreadCount() {
    return items.filter((i) => !i.read).length;
  }

  async function markRead(id: number) {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: { "x-usuario": usuario },
      });
      if (!res.ok) {
        console.error("Erro marcando lido:", await res.text());
        return;
      }
      // atualizar localmente
      setItems((prev) => prev.map((p) => (p.id === id ? { ...p, read: true } : p)));
    } catch (err) {
      console.error(err);
    }
  }

  function handleItemClick(n: NotificationItem) {
    // marca lido e navega se houver target na payload
    markRead(n.id);
    const payload = n.data || {};
    // esperar campos possíveis: { leadId, tarefaId, url }
    if (payload.url) {
      window.location.href = payload.url;
    } else if (payload.leadId) {
      // abrir detalhe do lead (exemplo)
      window.location.href = `/crm/leads/${payload.leadId}`; // ajuste conforme sua rota de detalhe
    } else if (payload.tarefaId) {
      window.location.href = `/crm/tarefas/${payload.tarefaId}`; // ajuste conforme
    }
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (!open) fetchNotifications();
        }}
        className="relative rounded-full p-2 hover:bg-slate-100"
        title="Notificações"
      >
        <svg className="w-6 h-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {unreadCount() > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
            {unreadCount()}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[360px] max-h-[420px] overflow-auto rounded-lg bg-white shadow-lg border">
          <div className="p-3 border-b">
            <strong>Notificações</strong>
            <span className="ml-2 text-sm text-slate-500">{unreadCount()} não lida(s)</span>
          </div>

          {items.length === 0 ? (
            <div className="p-4 text-sm text-slate-500">Nenhuma notificação</div>
          ) : (
            <ul>
              {items.map((n) => {
                const payload = n.data || {};
                const title =
                  payload.mensagem || payload.tarefaId ? `Tarefa #${payload.tarefaId}` : payload.leadId ? `Lead #${payload.leadId}` : n.type;
                const subtitle = payload.mensagem || JSON.stringify(payload);
                return (
                  <li key={n.id} className={`p-3 border-b cursor-pointer hover:bg-slate-50 ${n.read ? "bg-white" : "bg-slate-50"}`} onClick={() => handleItemClick(n)}>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="text-sm font-medium text-slate-800">{title}</div>
                        <div className="mt-1 text-xs text-slate-500">{subtitle}</div>
                      </div>
                      <div className="text-xs text-slate-400">{new Date(n.created_at).toLocaleString()}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="p-3 text-center">
            <button
              onClick={() => {
                // marcar tudo como lido localmente e via API (simples: chamar PATCH para cada não-lida)
                const unread = items.filter((i) => !i.read);
                unread.forEach((i) => markRead(i.id));
                setItems((prev) => prev.map((p) => ({ ...p, read: true })));
              }}
              className="text-sm text-slate-700 underline"
            >
              Marcar tudo como lido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}