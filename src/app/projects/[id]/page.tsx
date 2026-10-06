import { AppShell } from "@/components/AppShell";
import { ProjectWorkspace } from "@/components/ProjectWorkspace";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AppShell>
      <ProjectWorkspace id={id} />
    </AppShell>
  );
}
