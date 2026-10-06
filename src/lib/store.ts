import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { Project } from "./types";

const root = process.cwd();
export const dataDir = path.join(root, "data", "projects");
export const artifactDir = path.join(root, "public", "artifacts");

function fileFor(id: string) {
  return path.join(dataDir, `${id}.json`);
}

export async function ensureDirs() {
  await mkdir(dataDir, { recursive: true });
  await mkdir(artifactDir, { recursive: true });
}

export async function saveProject(project: Project) {
  await ensureDirs();
  await writeFile(fileFor(project.id), JSON.stringify(project, null, 2), "utf8");
  return project;
}

export async function getProject(id: string): Promise<Project | null> {
  try {
    const raw = await readFile(fileFor(id), "utf8");
    return JSON.parse(raw) as Project;
  } catch {
    return null;
  }
}

export async function patchProject(id: string, fn: (p: Project) => Project | Promise<Project>) {
  const current = await getProject(id);
  if (!current) throw new Error("Project not found");
  const next = await fn(current);
  return saveProject(next);
}

export async function addLog(id: string, message: string) {
  return patchProject(id, (p) => ({
    ...p,
    logs: [...p.logs, { at: new Date().toISOString(), message }].slice(-40),
  }));
}

export function artifactPublicPath(projectId: string, filename: string) {
  return `/artifacts/${projectId}/${filename}`;
}

export function artifactDiskDir(projectId: string) {
  return path.join(artifactDir, projectId);
}
