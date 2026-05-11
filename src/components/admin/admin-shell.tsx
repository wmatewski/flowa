"use client";

import { Building2, FileText, LayoutDashboard, Plus, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";
import { formatMembershipRole } from "@/lib/format";
import type { MembershipRole } from "@/lib/types";

interface AdminShellProps {
  displayName: string;
  email: string;
  organizationName: string;
  role: MembershipRole;
  children: React.ReactNode;
}

export const AdminShell = ({
  displayName,
  email,
  organizationName,
  role,
  children,
}: AdminShellProps) => {
  const pathname = usePathname();
  const initials = (displayName || organizationName || email)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "WF";
  const userLabel = displayName.trim() || email.split("@")[0] || "Organizator";

  const navItems = [
    {
      href: "/admin",
      label: "Pulpit",
      description: "Statystyki i aktywność",
      icon: LayoutDashboard,
    },
    {
      href: "/admin/sessions",
      label: "Ankiety",
      description: "Lista, wyniki i filtrowanie",
      icon: FileText,
    },
    {
      href: "/admin/organization",
      label: "Organizacja",
      description: "Współtwórcy i role",
      icon: Users,
      hidden: role === "moderator",
    },
    {
      href: "/admin/sessions/new",
      label: "Nowa ankieta",
      description: "Szybkie utworzenie sesji",
      icon: Plus,
    },
  ].filter((item) => !item.hidden);

  const isActive = (href: string) =>
    href === "/admin"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="wf-admin-layout">
      <aside className="wf-admin-sidebar">
        <div className="wf-admin-brand-block">
          <Link className="wf-brand" href="/admin">
            <div className="wf-brand-mark">
              <Building2 size={18} />
            </div>
            <div className="wf-admin-brand-copy">
              <span>Wojticore Flowa</span>
              <span className="wf-admin-brand-subtitle">Panel sterowania</span>
            </div>
          </Link>
        </div>

        <nav className="wf-admin-nav">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                className={`wf-admin-nav-link${isActive(item.href) ? " is-active" : ""}`}
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
      </aside>

      <section className="wf-admin-main">
        <header className="wf-admin-header">
          <div className="wf-admin-header-copy">
            <div className="wf-small-label">Aktywna przestrzeń</div>
            <div className="wf-admin-header-line">
              <h1 className="wf-admin-shell-title">{organizationName}</h1>
              <div className="wf-pill">{formatMembershipRole(role)}</div>
            </div>
            <p className="wf-admin-shell-subtitle">
              Wszystkie ankiety, wyniki i współtwórcy w jednym dashboardzie.
            </p>
          </div>

          <div className="wf-admin-header-meta">
            <div className="wf-admin-user-menu">
              <button aria-label="Menu konta" className="wf-admin-user-trigger" type="button">
                <div className="wf-admin-avatar">{initials}</div>
              </button>

              <div className="wf-admin-user-panel" role="menu">
                <div className="wf-admin-user-panel-top">
                  <div className="wf-admin-avatar">{initials}</div>
                  <div className="wf-admin-user-copy">
                    <strong className="wf-admin-user-name">{userLabel}</strong>
                    <span className="wf-admin-profile-email">{email}</span>
                  </div>
                </div>

                <div className="wf-admin-user-details">
                  <div className="wf-admin-user-detail-row">
                    <span className="wf-table-muted">Organizacja</span>
                    <strong>{organizationName}</strong>
                  </div>
                  <div className="wf-admin-user-detail-row">
                    <span className="wf-table-muted">Rola</span>
                    <strong>{formatMembershipRole(role)}</strong>
                  </div>
                </div>

                <LogoutButton />
              </div>
            </div>
          </div>
        </header>

        <div className="wf-admin-content">{children}</div>
      </section>
    </div>
  );
};