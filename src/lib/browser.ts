import { chromium, type Browser } from "playwright";

export async function launchBrowser(): Promise<Browser> {
  const attempts: Array<{ channel?: string }> = [{ channel: "msedge" }, { channel: "chrome" }, {}];
  let lastError: unknown;
  for (const opts of attempts) {
    try {
      return await chromium.launch({ ...opts, headless: true });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Could not launch a browser.");
}
