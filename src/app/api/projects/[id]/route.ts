import { NextResponse } from "next/server";
import { getProject } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const project = await getProject(id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { password, ...rest } = project;
  return NextResponse.json({ ...rest, hasPassword: Boolean(password) });
}
