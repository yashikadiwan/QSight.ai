import { NextResponse } from "next/server";
import { composeCases } from "@/lib/compose";
import { runScan } from "@/lib/crawler";
import { saveProject } from "@/lib/store";
import type { CaptureMode, Project } from "@/lib/types";

export const runtime = "nodejs";

const MODES: CaptureMode[] = ["ai", "requirements", "api", "import"];

export async function POST(request: Request) {
  const body = (await request.json()) as {
    url?: string;
    username?: string;
    password?: string;
    captureMode?: CaptureMode;
    sourceText?: string;
  };

  const captureMode: CaptureMode = MODES.includes(body.captureMode as CaptureMode)
    ? (body.captureMode as CaptureMode)
    : "ai";
  const url = (body.url || "").trim();
  const sourceText = (body.sourceText || "").trim();

  if (captureMode === "ai") {
    if (!url) {
      return NextResponse.json({ error: "A website URL is required." }, { status: 400 });
    }
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "That URL is not valid." }, { status: 400 });
    }
  }

  if (captureMode !== "ai" && !sourceText) {
    return NextResponse.json({ error: "Add at least one item to compose." }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const host = url
    ? (() => {
        try {
          return new URL(url).hostname;
        } catch {
          return "suite";
        }
      })()
    : "";

  const names: Record<CaptureMode, string> = {
    ai: host || "AI suite",
    requirements: "Requirements suite",
    api: "API suite",
    import: "Imported suite",
  };

  const project: Project = {
    id,
    name: names[captureMode],
    url,
    username: (body.username || "").trim(),
    password: body.password || "",
    captureMode,
    sourceText,
    status: captureMode === "ai" ? "scanning" : "cases",
    createdAt: new Date().toISOString(),
    logs: [
      {
        at: new Date().toISOString(),
        message:
          captureMode === "ai"
            ? "Scan queued."
            : `Started from ${captureMode}. Drafted into cases.`,
      },
    ],
    cases: captureMode === "ai" ? [] : composeCases(captureMode, sourceText),
    results: [],
  };
  await saveProject(project);
  if (captureMode === "ai") void runScan(id);
  return NextResponse.json({ id });
}
