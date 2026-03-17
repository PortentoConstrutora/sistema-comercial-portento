"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AgendaPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/tarefas-crm");
  }, [router]);

  return null;
}