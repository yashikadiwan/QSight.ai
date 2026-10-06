import { NextResponse } from "next/server";
import { runSuite } from "@/lib/executor";
import { getProject, patchProject } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const project = await getProject(id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await request.json()) as { caseIds?: string[] };
  const caseIds = body.caseIds || [];
  if (!caseIds.length) {
    return NextResponse.json({ error: "Select at least one case." }, { status: 400 });
  }

  await patchProject(id, (p) => ({
    ...p,
    cases: p.cases.map((c) => ({ ...c, selected: caseIds.includes(c.id) })),
  }));

  void runSuite(id, caseIds);
  return NextResponse.json({ ok: true });
}
