"use client";

import { UserButton } from "@clerk/nextjs";
import { Building2, FileText, LayoutDashboard, Plus, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import type { MembershipRole } from "@/lib/types";

interface AdminShellProps {
  displayName: string;
  email: string;
  organizationName: string;
  role: MembershipRole;
  children: React.ReactNode;
}

export const AdminShell = ({
  role,
  children,
}: AdminShellProps) => {
  const pathname = usePathname();

  useEffect(() => {
    document.getElementById("wf-main-scroll")?.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  const isSessionWorkspace =
    /^\/admin\/sessions\/[^/]/.test(pathname) &&
    !pathname.startsWith("/admin/sessions/new");

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
    {
      href: "/admin/settings",
      label: "Ustawienia",
      description: "Komunikaty i konfiguracja",
      icon: Settings,
    },
  ].filter((item) => !item.hidden);

  const isActive = (href: string) =>
    href === "/admin"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className={`wf-admin-layout${isSessionWorkspace ? " wf-admin-layout--session" : ""}`}>
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

      <section className="wf-admin-main" id="wf-main-scroll">
        <header className="wf-admin-header">
          {isSessionWorkspace ? (
            <span className="wf-admin-header-brand">Wojticore Flowa</span>
          ) : null}
          <UserButton
            appearance={{
              variables: {
                colorPrimary: "#005f6e",
                borderRadius: "4px",
              },
            }}
          />
        </header>

        <div className="wf-admin-content">{children}</div>
      </section>
    </div>
  );
};