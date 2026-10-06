import { NextResponse } from "next/server";
import { runScan } from "@/lib/crawler";
import { getProject, patchProject } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const project = await getProject(id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await patchProject(id, (p) => ({
    ...p,
    status: "scanning",
    error: undefined,
    siteModel: undefined,
    cases: [],
    results: [],
    caseChoice: undefined,
    logs: [...p.logs, { at: new Date().toISOString(), message: "Reading the site again." }],
  }));
  void runScan(id);
  return NextResponse.json({ ok: true });
}
