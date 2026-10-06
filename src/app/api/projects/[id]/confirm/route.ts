import { NextResponse } from "next/server";
import { getProject, patchProject } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const project = await getProject(id);
  if (!project?.siteModel) {
    return NextResponse.json({ error: "Map is not ready." }, { status: 400 });
  }

  const body = (await request.json()) as { pageIds?: string[] };

  const pageIds = new Set(body.pageIds || []);
  if (!pageIds.size) {
    return NextResponse.json({ error: "Select at least one page." }, { status: 400 });
  }

  const siteModel = {
    ...project.siteModel,
    pages: project.siteModel.pages.map((p) => ({ ...p, selected: pageIds.has(p.id) })),
    features: project.siteModel.features.map((f) => ({
      ...f,
      selected: f.pageIds.some((id) => pageIds.has(id)) || f.id === "navigation",
    })),
  };

  await patchProject(id, (p) => ({
    ...p,
    status: "cases",
    siteModel,
    cases: [],
    caseChoice: undefined,
  }));

  return NextResponse.json({ ok: true });
}
