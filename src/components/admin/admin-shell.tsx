"use client";

import { Building2, FileText, LayoutDashboard, Plus, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";
import { formatMembershipRole } from "@/lib/format";
import type { MembershipRole } from "@/lib/types";

interface AdminShellProps {
  email: string;
  organizationName: string;
  role: MembershipRole;
  children: React.ReactNode;
}

export const AdminShell = ({
  email,
  organizationName,
  role,
  children,
}: AdminShellProps) => {
  const pathname = usePathname();
  const initials = organizationName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "WF";

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

        <div className="wf-admin-profile-card">
          <div className="wf-admin-profile-head">
            <div className="wf-admin-avatar">{initials}</div>
            <div className="wf-admin-profile-copy">
              <div className="wf-admin-org-name">{organizationName}</div>
              <div className="wf-admin-profile-email">{email}</div>
            </div>
          </div>
          <div className="wf-card-actions">
            <div className="wf-pill wf-pill-soft">{formatMembershipRole(role)}</div>
            <Link className="wf-btn wf-btn-secondary" href="/admin/sessions/new">
              Nowa ankieta
            </Link>
          </div>
          <LogoutButton />
        </div>
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
            <div className="wf-admin-header-contact">
              <span>{email}</span>
              <span className="wf-admin-header-separator" />
              <span>Wojticore Flowa</span>
            </div>
            <div className="wf-admin-avatar">{initials}</div>
          </div>
        </header>

        <div className="wf-admin-content">{children}</div>
      </section>
    </div>
  );
};