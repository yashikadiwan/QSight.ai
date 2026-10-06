import type { CaptureMode, TestCase } from "./types";

function linesOf(text: string) {
  return text
    .split(/\n+/)
    .map((line) => line.replace(/^[\s*-]+/, "").replace(/^\d+[.)]\s*/, "").trim())
    .filter(Boolean);
}

function pad(n: number) {
  return String(n).padStart(3, "0");
}

export function composeCases(mode: CaptureMode, sourceText: string): TestCase[] {
  const lines = linesOf(sourceText);

  if (mode === "requirements") {
    const items = lines.length ? lines : ["User can complete the primary happy path"];
    return items.map((item, index) => ({
      id: `TC-REQ-${pad(index + 1)}`,
      featureId: "custom" as const,
      recipe: "composed",
      title: item.slice(0, 90),
      steps: ["Map the requirement to a check", item],
      expected: item,
      selected: true,
    }));
  }

  if (mode === "api") {
    const items = lines.length ? lines : ["Health check on the documented API"];
    return items.map((item, index) => ({
      id: `TC-API-${pad(index + 1)}`,
      featureId: "custom" as const,
      recipe: "composed",
      title: item.slice(0, 90),
      steps: ["Load the API definition", item],
      expected: "The endpoint matches the spec.",
      selected: true,
    }));
  }

  const items = lines.length ? lines : ["Imported test from existing assets"];
  return items.map((item, index) => ({
    id: `TC-IMP-${pad(index + 1)}`,
    featureId: "custom" as const,
    recipe: "composed",
    title: item.slice(0, 90),
    steps: ["Import existing asset", item],
    expected: item,
    selected: true,
  }));
}

export function captureLabel(mode?: string) {
  switch (mode) {
    case "requirements":
      return "From requirements";
    case "api":
      return "From API notes";
    case "import":
      return "Imported tests";
    default:
      return "Generated with AI";
  }
}
