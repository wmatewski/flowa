"use client";

import { BarChart3, Eye, Radio, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { formatNumber, formatSessionStatus } from "@/lib/format";
import type { SessionStatus } from "@/lib/types";

interface SessionWorkspaceShellProps {
  sessionId: string;
  sessionName: string;
  sessionSlug: string;
  sessionStatus: SessionStatus;
  participantCount: number;
  children: React.ReactNode;
}

export const SessionWorkspaceShell = ({
  sessionId,
  sessionName,
  sessionSlug,
  sessionStatus,
  participantCount,
  children,
}: SessionWorkspaceShellProps) => {
  const pathname = usePathname();
  const navigation = [
    {
      href: `/admin/sessions/${sessionId}`,
      label: "Przegląd ankiety",
      description: "QR, link i najnowsze odpowiedzi",
      icon: Eye,
    },
    {
      href: `/admin/sessions/${sessionId}/analytics`,
      label: "Analityka",
      description: "Metryki i tabela wyników",
      icon: BarChart3,
    },
    {
      href: `/admin/sessions/${sessionId}/live`,
      label: "Wyniki na żywo",
      description: "Tryb prezentacyjny i embed",
      icon: Radio,
    },
    {
      href: `/admin/sessions/${sessionId}/settings`,
      label: "Ustawienia ankiety",
      description: "Konfiguracja i limity",
      icon: Settings,
    },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div className="wf-session-workspace">
      <aside className="wf-session-sidebar">
        <div className="wf-session-sidebar-header">
          <Link className="wf-link-button" href="/admin/sessions">
            Wróć do listy ankiet
          </Link>
          <div className="wf-session-sidebar-title">{sessionName}</div>
          <div className="wf-card-actions">
            <div className="wf-status-chip optimal">{formatSessionStatus(sessionStatus)}</div>
            <div className="wf-pill">{formatNumber(participantCount)} odpowiedzi</div>
          </div>
        </div>

        <nav className="wf-session-sidebar-nav">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                className={`wf-session-sidebar-link${isActive(item.href) ? " is-active" : ""}`}
                href={item.href}
                key={item.href}
              >
                <Icon size={18} />
                <span className="wf-admin-nav-link-label">
                  <span>{item.label}</span>
                  <span className="wf-admin-nav-link-meta">{item.description}</span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="wf-session-sidebar-meta">
          <div className="wf-small-label">Publiczny link</div>
          <Link className="wf-btn wf-btn-secondary wf-btn-block" href={`/flow/${sessionSlug}`}>
            Otwórz ankietę
          </Link>
          <Link className="wf-btn wf-btn-primary wf-btn-block" href={`/admin/sessions/${sessionId}/live`}>
            Tryb live
          </Link>
        </div>
      </aside>

      <div className="wf-session-workspace-content">{children}</div>
    </div>
  );
};