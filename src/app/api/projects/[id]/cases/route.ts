import { NextResponse } from "next/server";
import { composeCases } from "@/lib/compose";
import { instantiateCases } from "@/lib/recipes";
import { getProject, patchProject } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const project = await getProject(id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (project.status !== "cases" && project.status !== "review") {
    return NextResponse.json({ error: "Cases are not ready yet." }, { status: 400 });
  }

  const body = (await request.json()) as {
    source?: "ai" | "provided" | "reset";
    sourceText?: string;
    recipeIds?: string[];
  };

  if (body.source === "reset") {
    await patchProject(id, (p) => ({
      ...p,
      status: "cases",
      caseChoice: undefined,
      cases: [],
      sourceText: "",
    }));
    return NextResponse.json({ ok: true });
  }

  if (body.source === "ai") {
    if (!project.siteModel) {
      return NextResponse.json({ error: "Map is not ready." }, { status: 400 });
    }
    const cases = instantiateCases(project.siteModel, body.recipeIds);
    await patchProject(id, (p) => ({
      ...p,
      status: "cases",
      caseChoice: "ai",
      cases,
    }));
    return NextResponse.json({ ok: true, count: cases.length });
  }

  if (body.source === "provided") {
    const sourceText = (body.sourceText || "").trim();
    if (!sourceText) {
      return NextResponse.json({ error: "Add a journey, requirement, or user story." }, { status: 400 });
    }
    const cases = composeCases("requirements", sourceText);
    await patchProject(id, (p) => ({
      ...p,
      status: "cases",
      caseChoice: "provided",
      sourceText,
      cases,
    }));
    return NextResponse.json({ ok: true, count: cases.length });
  }

  return NextResponse.json({ error: "Choose how to build the cases." }, { status: 400 });
}
