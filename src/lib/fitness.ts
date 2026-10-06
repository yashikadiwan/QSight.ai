import type { Fitness } from "./types";

const CERTIFIED_HOSTS = new Set(["www.saucedemo.com", "saucedemo.com"]);

export function probeFitness(input: {
  host: string;
  title: string;
  html: string;
  url: string;
}): Fitness {
  const reasons: string[] = [];
  const blockers: string[] = [];
  const text = `${input.title}\n${input.html}`.toLowerCase();

  if (CERTIFIED_HOSTS.has(input.host)) {
    reasons.push("Sauce Demo is the Phase 1 certified site.");
    reasons.push("Small catalog, fake checkout, no CAPTCHA, stable data-test hooks.");
    return { allowed: true, score: 92, reasons, blockers };
  }

  if (
    text.includes("captcha") ||
    text.includes("cf-challenge") ||
    text.includes("cf-browser-verification")
  ) {
    blockers.push("CAPTCHA or bot challenge detected.");
  }
  if (text.includes("cloudflare") && text.includes("just a moment")) {
    blockers.push("Cloudflare interstitial.");
  }

  const hasLogin =
    (text.includes("password") && (text.includes("username") || text.includes("email"))) ||
    /type=["']password["']/.test(input.html);

  if (hasLogin) reasons.push("A login form is present.");
  reasons.push(`Host: ${input.host}`);

  if (blockers.length) {
    return { allowed: false, score: 12, reasons, blockers };
  }

  return {
    allowed: true,
    score: 70,
    reasons: [...reasons, "No CAPTCHA on the first page. Treat as a trial crawl."],
    blockers,
  };
}

export function isSauceDemo(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host === "saucedemo.com";
  } catch {
    return false;
  }
}
