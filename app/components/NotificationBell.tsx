// app/components/NotificationBell.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type NotificationPayload = {
  mensagem?: string;
  url?: string;
  tarefaId?: number;
  leadId?: number;
  tarefaNome?: string;
  atividadeNome?: string;
  leadNome?: string;
  nomeLead?: string;
};

type NotificationItem = {
  id: number;
  usuario: string;
  type: string;
  data: NotificationPayload | null;
  read: boolean;
  created_at: string;
};

function limparTexto(valor?: string | null) {
  return (valor || "").trim();
}

function primeiroTexto(...valores: Array<string | undefined | null>) {
  return valores.map(limparTexto).find(Boolean) || "";
}

export default function NotificationBell() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [usuario, setUsuario] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const usuarioSalvo = localStorage.getItem("portento_usuario") || "";
    setUsuario(usuarioSalvo);
  }, []);

  useEffect(() => {
    if (!usuario) return;
    void fetchNotifications(usuario);
  }, [usuario]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!open || !containerRef.current) return;

      const target = event.target as Node;
      if (!containerRef.current.contains(target)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const unreadCount = useMemo(() => {
    return items.filter((item) => !item.read).length;
  }, [items]);

  async function fetchNotifications(usuarioAtual: string = usuario) {
    if (!usuarioAtual) return;

    try {
      const res = await fetch("/api/notifications", {
        headers: { "x-usuario": usuarioAtual },
      });

      if (!res.ok) {
        console.error("Erro ao buscar notificações:", await res.text());
        return;
      }

      const json = (await res.json()) as NotificationItem[];
      setItems(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error("Erro ao buscar notificações:", err);
    }
  }

  async function markRead(id: number) {
    if (!usuario) return;

    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: { "x-usuario": usuario },
      });

      if (!res.ok) {
        console.error("Erro ao marcar como lida:", await res.text());
        return;
      }

      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, read: true } : item
        )
      );
    } catch (err) {
      console.error("Erro ao marcar notificação como lida:", err);
    }
  }

  function getTipoBonito(notification: NotificationItem) {
    const tipo = limparTexto(notification.type).toLowerCase();

    if (tipo.includes("novo lead")) return "Novo lead";
    if (tipo.includes("lead novo")) return "Novo lead";
    if (tipo.includes("retorno")) return "Retorno agendado";
    if (tipo.includes("liga")) return "Ligação pendente";
    if (tipo.includes("visita")) return "Visita agendada";
    if (tipo.includes("proposta")) return "Proposta pendente";
    if (tipo.includes("tarefa")) return "Atividade pendente";
    if (tipo.includes("atividade")) return "Atividade pendente";
    if (tipo.includes("lead")) return "Lead";

    return notification.type || "Notificação";
  }

  function getLeadNome(payload: NotificationPayload) {
    return primeiroTexto(payload.leadNome, payload.nomeLead);
  }

  function getTarefaNome(payload: NotificationPayload) {
    return primeiroTexto(payload.tarefaNome, payload.atividadeNome);
  }

  function isNovoLead(notification: NotificationItem) {
    const tipo = limparTexto(notification.type).toLowerCase();
    return tipo.includes("novo lead") || tipo.includes("lead novo");
  }

  function getNotificationTitle(notification: NotificationItem) {
    const payload = notification.data ?? {};
    const tipoBonito = getTipoBonito(notification);
    const leadNome = getLeadNome(payload);
    const tarefaNome = getTarefaNome(payload);

    if (tipoBonito === "Novo lead" && leadNome) {
      return `Novo lead • ${leadNome}`;
    }

    if (tarefaNome && leadNome) {
      return `${tarefaNome} • ${leadNome}`;
    }

    if (tarefaNome) {
      return tarefaNome;
    }

    if (leadNome) {
      if (tipoBonito === "Lead") return `Lead • ${leadNome}`;
      return `${tipoBonito} • ${leadNome}`;
    }

    const mensagem = limparTexto(payload.mensagem);
    if (mensagem && mensagem.length <= 55) {
      return mensagem;
    }

    if (payload.tarefaId) return `Atividade ${payload.tarefaId}`;
    if (payload.leadId) return `Lead ${payload.leadId}`;

    return tipoBonito;
  }

  function getNotificationSubtitle(notification: NotificationItem) {
    const payload = notification.data ?? {};
    const mensagem = limparTexto(payload.mensagem);

    if (mensagem) {
      return mensagem;
    }

    if (isNovoLead(notification)) {
      return "Abrir leads novos";
    }

    if (payload.tarefaId) {
      return `Abrir atividade ${payload.tarefaId}`;
    }

    if (payload.leadId) {
      return "Abrir lead";
    }

    if (payload.url) {
      return "Abrir detalhe";
    }

    return "Abrir notificação";
  }

  function getNotificationTarget(notification: NotificationItem) {
    const payload = notification.data ?? {};

    if (payload.url) return payload.url;
    if (isNovoLead(notification)) return "/crm";
    if (payload.tarefaId) return `/tarefas-crm?tarefa=${payload.tarefaId}`;
    if (payload.leadId) return `/crm`;

    return null;
  }

  async function handleItemClick(notification: NotificationItem) {
    await markRead(notification.id);

    const target = getNotificationTarget(notification);
    setOpen(false);

    if (target) {
      router.push(target);
    }
  }

  async function handleToggleOpen() {
    const nextOpen = !open;
    setOpen(nextOpen);

    if (nextOpen) {
      await fetchNotifications();
    }
  }

  async function handleMarkAllAsRead() {
    const unreadItems = items.filter((item) => !item.read);

    if (unreadItems.length === 0) return;

    try {
      await Promise.all(unreadItems.map((item) => markRead(item.id)));
      setItems((prev) => prev.map((item) => ({ ...item, read: true })));
    } catch (err) {
      console.error("Erro ao marcar todas como lidas:", err);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => void handleToggleOpen()}
        className="relative rounded-full p-2 hover:bg-slate-100"
        title="Notificações"
        type="button"
      >
        <svg
          className="h-6 w-6 text-slate-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-bold leading-none text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 max-h-[420px] w-[390px] overflow-auto rounded-xl border bg-white shadow-lg">
          <div className="sticky top-0 z-10 border-b bg-white p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <strong>Notificações</strong>
                <div className="text-sm text-slate-500">
                  {unreadCount} não lida(s)
                </div>
              </div>

              <button
                onClick={() => void handleMarkAllAsRead()}
                className="text-sm text-slate-700 underline"
                type="button"
              >
                Marcar tudo como lido
              </button>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="p-4 text-sm text-slate-500">
              Nenhuma notificação
            </div>
          ) : (
            <ul>
              {items.map((notification) => (
                <li
                  key={notification.id}
                  className={`cursor-pointer border-b p-3 transition hover:bg-slate-50 ${
                    notification.read ? "bg-white" : "bg-amber-50/40"
                  }`}
                  onClick={() => void handleItemClick(notification)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-800">
                        {getNotificationTitle(notification)}
                      </div>
                      <div className="mt-1 line-clamp-2 text-xs text-slate-500">
                        {getNotificationSubtitle(notification)}
                      </div>
                    </div>

                    <div className="shrink-0 text-[11px] text-slate-400">
                      {new Date(notification.created_at).toLocaleString()}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
