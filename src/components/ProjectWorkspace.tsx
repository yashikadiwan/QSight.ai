"use client";

import { useEffect, useMemo, useState } from "react";
import { captureLabel } from "@/lib/compose";
import { functionsForPage, observedActions, wantsRescan } from "@/lib/functions";
import type { Project, ProjectStatus } from "@/lib/types";

type PublicProject = Omit<Project, "password"> & { hasPassword?: boolean };

const STEPS = [
  { id: "scan", label: "Scan" },
  { id: "map", label: "Map" },
  { id: "cases", label: "Cases" },
  { id: "run", label: "Run" },
  { id: "report", label: "Report" },
];

const FEATURE_NAMES: Record<string, string> = {
  authentication: "Authentication",
  listing: "Product listing",
  detail: "Product details",
  cart: "Cart",
  checkout: "Checkout",
  navigation: "Navigation",
  custom: "Composed",
};

function stepIndex(status: ProjectStatus) {
  if (status === "scanning" || status === "error" || status === "refused") return 0;
  if (status === "review") return 1;
  if (status === "cases") return 2;
  if (status === "running") return 3;
  return 4;
}

export function ProjectWorkspace({ id }: { id: string }) {
  const [project, setProject] = useState<PublicProject | null>(null);
  const [pageIds, setPageIds] = useState<string[]>([]);
  const [caseIds, setCaseIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [caseSource, setCaseSource] = useState<"choose" | "provided-form" | "ai-pages" | "ai-functions">(
    "choose",
  );
  const [storyText, setStoryText] = useState("");
  const [aiPageIds, setAiPageIds] = useState<string[]>([]);
  const [aiFunctionIds, setAiFunctionIds] = useState<string[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chat, setChat] = useState<{ role: "user" | "assistant"; text: string }[]>([]);

  useEffect(() => {
    let alive = true;
    async function load() {
      const res = await fetch(`/api/projects/${id}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as PublicProject;
      if (!alive) return;
      setProject(data);
      if (data.siteModel && pageIds.length === 0) {
        setPageIds(data.siteModel.pages.filter((p) => p.selected).map((p) => p.id));
      }
      if (data.cases.length && caseIds.length === 0) {
        setCaseIds(data.cases.filter((c) => c.selected).map((c) => c.id));
      }
      return data.status;
    }
    load();
    const timer = setInterval(async () => {
      const status = await load();
      if (status === "report" || status === "error" || status === "refused") {
        clearInterval(timer);
      }
    }, 1200);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [id, pageIds.length, caseIds.length]);

  useEffect(() => {
    if (!project?.siteModel || project.status !== "review" || chat.length) return;
    setChat([
      {
        role: "assistant",
        text: `I found ${project.siteModel.pages.length} pages. If a page or function is missing, ask me to read the site again.`,
      },
    ]);
  }, [project, chat.length]);

  const grouped = useMemo(() => {
    const map = new Map<string, PublicProject["cases"]>();
    for (const c of project?.cases || []) {
      const list = map.get(c.featureId) || [];
      list.push(c);
      map.set(c.featureId, list);
    }
    return [...map.entries()];
  }, [project]);

  if (!project) {
    return <p className="text-white text-sm">Loading…</p>;
  }

  const active = stepIndex(project.status);

  async function confirmMap() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/projects/${id}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageIds }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Could not confirm the map.");
    else {
      const fresh = await fetch(`/api/projects/${id}`, { cache: "no-store" });
      if (fresh.ok) setProject(await fresh.json());
    }
    setBusy(false);
    setCaseIds([]);
    setCaseSource("choose");
    setStoryText("");
    setAiPageIds([]);
    setAiFunctionIds([]);
  }

  async function runCases() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/projects/${id}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseIds }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Could not start the run.");
    setBusy(false);
  }

  async function pickAiCases() {
    setError("");
    const pages = (project.siteModel?.pages || []).filter((p) => p.selected);
    setAiPageIds(pages.map((p) => p.id));
    setAiFunctionIds([]);
    setCaseSource("ai-pages");
  }

  async function draftAiCases() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/projects/${id}/cases`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "ai", recipeIds: aiFunctionIds }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Could not draft the AI cases.");
    else {
      const fresh = await fetch(`/api/projects/${id}`, { cache: "no-store" });
      if (fresh.ok) {
        const next = await fresh.json();
        setProject(next);
        setCaseIds(next.cases.filter((c: { selected: boolean }) => c.selected).map((c: { id: string }) => c.id));
      }
    }
    setBusy(false);
  }

  async function rescanSite() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/projects/${id}/rescan`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Could not read the site again.");
    else {
      setPageIds([]);
      setChat((msgs) => [
        ...msgs,
        { role: "assistant", text: "Reading the site again. New pages and functions will show here when the scan finishes." },
      ]);
    }
    setBusy(false);
  }

  async function sendChat() {
    const text = chatInput.trim();
    if (!text) return;
    setChatInput("");
    setChat((msgs) => [...msgs, { role: "user", text }]);
    if (wantsRescan(text)) {
      await rescanSite();
      return;
    }
    const pages = project.siteModel?.pages || [];
    const names = pages.map((p) => p.type).join(", ") || "none yet";
    setChat((msgs) => [
      ...msgs,
      {
        role: "assistant",
        text: `I currently have these pages: ${names}. If something is missing, ask me to read the site again.`,
      },
    ]);
  }

  async function submitStories() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/projects/${id}/cases`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "provided", sourceText: storyText }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Could not draft those cases.");
    else {
      const fresh = await fetch(`/api/projects/${id}`, { cache: "no-store" });
      if (fresh.ok) {
        const next = await fresh.json();
        setProject(next);
        setCaseIds(next.cases.filter((c: { selected: boolean }) => c.selected).map((c: { id: string }) => c.id));
      }
    }
    setBusy(false);
  }

  async function resetCaseSource() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/projects/${id}/cases`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "reset" }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Could not change source.");
    else {
      const fresh = await fetch(`/api/projects/${id}`, { cache: "no-store" });
      if (fresh.ok) setProject(await fresh.json());
    }
    setBusy(false);
    setCaseIds([]);
    setCaseSource("choose");
    setStoryText("");
    setAiPageIds([]);
    setAiFunctionIds([]);
  }

  const counts = { pass: 0, fail: 0, blocked: 0, skipped: 0 };
  for (const r of project.results) counts[r.status] += 1;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {STEPS.map((step, index) => (
          <span
            key={step.id}
            className={`rounded-full px-3 py-1 text-sm ${
              index === active
                ? "bg-[#3eea8a] text-[#04140c]"
                : index < active
                  ? "bg-[#123526] text-[#3eea8a]"
                  : "bg-transparent text-white"
            }`}
          >
            {step.label}
          </span>
        ))}
      </div>

      <div className="mt-6">
        {project.url ? (
          <p className="font-mono text-xs text-white">{project.url}</p>
        ) : null}
        <h1 className="display mt-1 text-3xl">
          {project.name}
        </h1>
        <p className="mt-2 text-sm text-[var(--green)]">
          {captureLabel(project.captureMode || "ai")}
        </p>
      </div>

      {project.status === "scanning" && (
        <section className="card mt-6 p-5">
          <p className="font-medium">Scanning the site…</p>
          <p className="text-white mt-1 text-sm">
            A browser is opening pages and taking screenshots.
          </p>
          <ul className="mt-4 space-y-2">
            {project.logs.slice(-8).map((log) => (
              <li key={log.at + log.message} className="font-mono text-xs text-white">
                {log.message}
              </li>
            ))}
          </ul>
        </section>
      )}

      {project.status === "error" && (
        <section className="card mt-6 p-5">
          <h2 className="font-semibold">Scan failed</h2>
          <p className="mt-2 text-sm text-rose-400">{project.error}</p>
        </section>
      )}

      {project.status === "refused" && project.siteModel && (
        <section className="card mt-6 p-5">
          <h2 className="font-semibold">This site is out of scope</h2>
          <p className="text-white mt-2 text-sm">{project.siteModel.gist}</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-rose-400">
            {project.siteModel.fitness.blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </section>
      )}

      {project.status === "review" && project.siteModel && (
        <section className="mt-6">
          <div className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <p className="max-w-2xl text-[15px] leading-relaxed text-white">
                {project.siteModel.gist}
              </p>
              <div className="rounded-xl bg-[#123526] px-4 py-3 text-center">
                <p className="text-2xl font-semibold text-[#3eea8a]">
                  {project.siteModel.fitness.score}
                </p>
                <p className="text-xs text-white">Fitness</p>
              </div>
            </div>
          </div>

          <h2 className="display mt-8 text-2xl">Pages</h2>
          <p className="text-white mt-1 text-sm">Click a page to include or skip it.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {project.siteModel.pages.map((page) => {
              const on = pageIds.includes(page.id);
              return (
                <button
                  type="button"
                  key={page.id}
                  onClick={() =>
                    setPageIds((ids) =>
                      on ? ids.filter((x) => x !== page.id) : [...ids, page.id],
                    )
                  }
                  className={`card overflow-hidden text-left ${
                    on ? "ring-2 ring-[var(--green)]" : "ring-1 ring-[var(--line)]"
                  }`}
                >
                  {page.screenshot ? (
                    <img
                      src={page.screenshot}
                      alt={`${page.type} screenshot`}
                      className="h-40 w-full object-cover object-top"
                    />
                  ) : null}
                  <div className="p-3">
                    <p className="text-xs font-medium text-[var(--green)]">{page.type}</p>
                    <p className="mt-1 text-sm font-medium">{page.purpose}</p>
                    <p className="mt-1 truncate font-mono text-[13px] text-white">{page.url}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <h2 className="display mt-8 text-2xl">Functionality found</h2>
          <p className="text-white mt-1 text-sm">
            What QSight.ai could use on each page. Ask below if something is missing.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {project.siteModel.pages.map((page) => {
              const actions = observedActions(page);
              return (
                <div key={`fn-${page.id}`} className="card p-4">
                  <p className="text-xs font-medium text-[#3eea8a]">{page.type}</p>
                  <p className="mt-1 text-sm font-medium text-white">{page.purpose}</p>
                  {actions.length ? (
                    <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-white">
                      {actions.map((action) => (
                        <li key={action}>{action}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-white mt-3 text-sm">No controls captured on this page.</p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="card mt-8 p-4">
            <p className="text-sm font-semibold text-white">Did we miss something?</p>
            <p className="text-white mt-1 text-sm">
              Ask QSight.ai to read the site again if a page or function is missing.
            </p>
            <div className="mt-3 max-h-40 space-y-2 overflow-y-auto">
              {chat.map((msg, index) => (
                <p
                  key={index}
                  className={`text-sm text-white`}
                >
                  <span className="font-medium text-[#3eea8a]">
                    {msg.role === "user" ? "You" : "QSight.ai"}
                  </span>
                  {` — ${msg.text}`}
                </p>
              ))}
            </div>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void sendChat();
              }}
            >
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="field"
                placeholder="e.g. You missed checkout — read again"
              />
              <button type="submit" disabled={busy || !chatInput.trim()} className="btn shrink-0">
                Send
              </button>
            </form>
          </div>

          {error ? <p className="mt-4 text-sm text-rose-400">{error}</p> : null}
          <button
            type="button"
            onClick={confirmMap}
            disabled={busy || !pageIds.length}
            className="btn mt-6"
          >
            {busy ? "Preparing…" : "Continue to test cases"}
          </button>
        </section>
      )}

      {project.status === "cases" && !project.cases.length && caseSource === "choose" && (
        <section className="mt-6">
          <h2 className="display text-2xl">How should we build the cases?</h2>
          <p className="text-white mt-2 max-w-2xl text-[15px] leading-relaxed">
            The crawler and understander have mapped the site. Now either give us
            the journeys, requirements, or user stories you care about — or review
            the cases QSight.ai drafted from that map.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setError("");
                setCaseSource("provided-form");
              }}
              className="card p-5 text-left hover:ring-2 hover:ring-[var(--green)]"
            >
              <p className="text-sm font-semibold">Give us your journeys</p>
              <p className="text-white mt-2 text-sm leading-relaxed">
                Paste journeys, requirements, or user stories. We turn them into
                cases you can review before anything runs.
              </p>
            </button>
            <button
              type="button"
              onClick={pickAiCases}
              disabled={busy}
              className="card p-5 text-left hover:ring-2 hover:ring-[var(--green)]"
            >
              <p className="flex items-center gap-2 text-sm font-semibold">
                Use AI-generated cases
                <span className="pill pill-pass">AI</span>
              </p>
              <p className="text-white mt-2 text-sm leading-relaxed">
                Pick a page, then pick the functions on that page. QSight.ai drafts
                cases only for what you select.
              </p>
            </button>
          </div>
          {error ? <p className="mt-4 text-sm text-rose-400">{error}</p> : null}
        </section>
      )}

      {project.status === "cases" && !project.cases.length && caseSource === "ai-pages" && project.siteModel && (
        <section className="mt-6">
          <button
            type="button"
            onClick={() => setCaseSource("choose")}
            className="text-sm text-[var(--green)] hover:underline"
          >
            Back to options
          </button>
          <h2 className="display mt-3 text-2xl">Which page should we test?</h2>
          <p className="text-white mt-2 text-sm">Select one or more pages from the map.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {project.siteModel.pages.map((page) => {
              const on = aiPageIds.includes(page.id);
              return (
                <button
                  type="button"
                  key={page.id}
                  onClick={() =>
                    setAiPageIds((ids) =>
                      on ? ids.filter((x) => x !== page.id) : [...ids, page.id],
                    )
                  }
                  className={`card p-4 text-left ${on ? "ring-2 ring-[var(--green)]" : ""}`}
                >
                  <p className="text-xs font-medium text-[#3eea8a]">{page.type}</p>
                  <p className="mt-1 text-sm font-medium text-white">{page.purpose}</p>
                  <p className="mt-1 truncate font-mono text-[13px] text-white">{page.url}</p>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            disabled={!aiPageIds.length}
            onClick={() => {
              setAiFunctionIds([]);
              setCaseSource("ai-functions");
            }}
            className="btn mt-6"
          >
            Next: choose functionality
          </button>
        </section>
      )}

      {project.status === "cases" && !project.cases.length && caseSource === "ai-functions" && project.siteModel && (
        <section className="mt-6">
          <button
            type="button"
            onClick={() => setCaseSource("ai-pages")}
            className="text-sm text-[var(--green)] hover:underline"
          >
            Back to pages
          </button>
          <h2 className="display mt-3 text-2xl">Which functionality should we test?</h2>
          <p className="text-white mt-2 text-sm">
            These are the functions QSight.ai can run on the pages you picked.
          </p>
          <div className="mt-5 space-y-4">
            {project.siteModel.pages
              .filter((page) => aiPageIds.includes(page.id))
              .map((page) => (
                <div key={page.id} className="card p-4">
                  <p className="text-xs font-medium text-[#3eea8a]">{page.type}</p>
                  <p className="mt-1 text-sm font-medium text-white">{page.purpose}</p>
                  <ul className="mt-3 space-y-2">
                    {functionsForPage(page).map((fn) => {
                      const on = aiFunctionIds.includes(fn.id);
                      return (
                        <li key={fn.id}>
                          <label className="flex cursor-pointer items-start gap-3">
                            <input
                              type="checkbox"
                              className="mt-1 accent-[#3eea8a]"
                              checked={on}
                              onChange={() =>
                                setAiFunctionIds((ids) =>
                                  on ? ids.filter((x) => x !== fn.id) : [...ids, fn.id],
                                )
                              }
                            />
                            <span className="text-sm text-white">{fn.label}</span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
          </div>
          {error ? <p className="mt-4 text-sm text-rose-400">{error}</p> : null}
          <button
            type="button"
            onClick={draftAiCases}
            disabled={busy || !aiFunctionIds.length}
            className="btn mt-6"
          >
            {busy ? "Drafting…" : "Draft these test cases"}
          </button>
        </section>
      )}

      {project.status === "cases" && !project.cases.length && caseSource === "provided-form" && (
        <section className="mt-6">
          <button
            type="button"
            onClick={() => setCaseSource("choose")}
            className="text-sm text-[var(--green)] hover:underline"
          >
            Back to options
          </button>
          <h2 className="display mt-3 text-2xl">
            Journeys, requirements, or user stories
          </h2>
          <p className="text-white mt-2 max-w-2xl text-sm leading-relaxed">
            One item per line. QSight.ai drafts a case from each line against the map
            you just confirmed.
          </p>
          <textarea
            value={storyText}
            onChange={(e) => setStoryText(e.target.value)}
            className="field mt-5 min-h-[200px] resize-y"
            placeholder={"User can sign in with a valid account\nAdd a backpack to the cart\nComplete checkout as a standard user"}
          />
          {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}
          <button
            type="button"
            onClick={submitStories}
            disabled={busy || !storyText.trim()}
            className="btn mt-5"
          >
            {busy ? "Drafting…" : "Draft cases from this"}
          </button>
        </section>
      )}

      {project.status === "cases" && project.cases.length > 0 && (
        <section className="mt-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="text-white max-w-xl text-sm">
              {project.caseChoice === "provided"
                ? "Drafted from the journeys and stories you gave us. Uncheck anything you do not want."
                : "These are the AI-generated cases from the map. Uncheck anything you do not want to run."}
            </p>
            <button
              type="button"
              onClick={resetCaseSource}
              disabled={busy}
              className="text-sm text-[var(--green)] hover:underline"
            >
              Use a different source
            </button>
          </div>
          <div className="mt-5 space-y-6">
            {grouped.map(([feature, cases]) => (
              <div key={feature} className="card p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-semibold">
                    {FEATURE_NAMES[feature] || feature}
                  </h2>
                  <span className="text-xs text-white">{cases.length}</span>
                </div>
                <ul className="divide-y divide-[var(--line)]">
                  {cases.map((c) => {
                    const on = caseIds.includes(c.id);
                    return (
                      <li key={c.id}>
                        <label className="flex cursor-pointer items-start gap-3 py-3">
                          <input
                            type="checkbox"
                            className="mt-1 accent-[#3eea8a]"
                            checked={on}
                            onChange={() =>
                              setCaseIds((ids) =>
                                on ? ids.filter((x) => x !== c.id) : [...ids, c.id],
                              )
                            }
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-baseline justify-between gap-2">
                              <span className="text-sm font-medium">{c.title}</span>
                              <span className="font-mono text-[13px] text-white">{c.id}</span>
                            </span>
                            <span className="mt-1 block text-sm text-white">{c.expected}</span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
          {error ? <p className="mt-4 text-sm text-rose-400">{error}</p> : null}
          {project.caseChoice !== "provided" ? (
            <button
              type="button"
              onClick={runCases}
              disabled={busy || !caseIds.length}
              className="btn mt-6"
            >
              {busy ? "Starting…" : `Run ${caseIds.length} tests`}
            </button>
          ) : (
            <p className="text-white mt-6 max-w-xl text-sm">
              These cases came from your stories. The runner for this path is
              next; AI-generated suites can be run today.
            </p>
          )}
        </section>
      )}

      {(project.status === "running" || project.status === "report") && (
        <section className="mt-6">
          {project.status === "running" && (
            <p className="text-white text-sm">Running tests in a real browser…</p>
          )}
          {project.status === "report" && (
            <div className="mb-6 grid grid-cols-3 gap-3">
              <div className="card p-4">
                <p className="text-2xl font-semibold text-[#3eea8a]">{counts.pass}</p>
                <p className="text-white mt-1 text-xs">Pass</p>
              </div>
              <div className="card p-4">
                <p className="text-2xl font-semibold text-rose-400">{counts.fail}</p>
                <p className="text-white mt-1 text-xs">Fail</p>
              </div>
              <div className="card p-4">
                <p className="text-2xl font-semibold text-amber-400">{counts.blocked}</p>
                <p className="text-white mt-1 text-xs">Blocked</p>
              </div>
            </div>
          )}
          <ul className="space-y-3">
            {project.results.map((result) => (
              <li key={result.caseId} className="card grid overflow-hidden sm:grid-cols-[1fr_200px]">
                <div className="p-4">
                  <span className={`pill pill-${result.status}`}>{result.status}</span>
                  <p className="mt-2 text-sm font-medium">{result.title}</p>
                  <p className="mt-1 text-sm text-white">{result.reason}</p>
                  <p className="mt-2 font-mono text-[13px] text-white">
                    {result.caseId} · {result.durationMs} ms
                  </p>
                </div>
                {result.screenshot ? (
                  <img
                    src={result.screenshot}
                    alt={`${result.title} evidence`}
                    className="h-36 w-full object-cover object-top sm:h-full"
                  />
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
