import { SessionWorkspaceShell } from "@/components/admin/session-workspace-shell";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";
import { getSessionWorkspaceSummary } from "@/lib/data";

export default async function SessionWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const { organization, membership, user } = await getAuthenticatedAdmin();
  const { session, overview } = await getSessionWorkspaceSummary(
    {
      organizationId: organization.id,
      membershipId: membership.id,
      role: membership.role,
      userId: user.id,
    },
    sessionId,
  );

  return (
    <SessionWorkspaceShell
      participantCount={overview?.participant_count ?? 0}
      sessionId={sessionId}
      sessionName={session.name}
      sessionSlug={session.slug}
      sessionStatus={session.status}
    >
      {children}
    </SessionWorkspaceShell>
  );
}