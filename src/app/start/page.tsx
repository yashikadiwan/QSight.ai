"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";

export default function StartPage() {
  const router = useRouter();
  const [url, setUrl] = useState("https://www.saucedemo.com/inventory.html");
  const [username, setUsername] = useState("standard_user");
  const [password, setPassword] = useState("secret_sauce");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ captureMode: "ai", url, username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start.");
      router.push(`/projects/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start.");
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <p className="eyebrow">Start a suite</p>
      <h1 className="display mt-3 max-w-2xl text-3xl sm:text-4xl">
        Point QSight.ai at the site.
      </h1>
      <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-white">
        The crawler walks the pages and the understander builds a map. After you
        confirm that map, you either give us journeys, requirements, and user
        stories — or review the AI-generated cases.
      </p>

      <form onSubmit={onSubmit} className="card mt-8 max-w-xl p-6">
        <label className="block">
          <span className="text-xs font-medium text-white">Website</span>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="field mt-1.5 font-mono text-[13px]"
            placeholder="https://"
            required
          />
        </label>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label>
            <span className="text-xs font-medium text-white">Test user</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="field mt-1.5"
              autoComplete="off"
            />
          </label>
          <label>
            <span className="text-xs font-medium text-white">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field mt-1.5"
              autoComplete="off"
            />
          </label>
        </div>
        <p className="mt-4 text-sm text-white">
          Phase 1 is tuned for Sauce Demo. Test user is filled in.
        </p>
        {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}
        <button type="submit" disabled={busy} className="btn mt-5 w-full">
          {busy ? "Starting…" : "Scan website"}
        </button>
      </form>
    </AppShell>
  );
}
