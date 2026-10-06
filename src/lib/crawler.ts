import { mkdir } from "fs/promises";
import path from "path";
import { type Page, type Locator } from "playwright";
import { launchBrowser } from "./browser";
import { classifyPage, gistFor, pageIdFromUrl, templateKey } from "./classify";
import { isSauceDemo, probeFitness } from "./fitness";
import { addLog, artifactDiskDir, artifactPublicPath, patchProject } from "./store";
import type { Feature, FeatureId, Field, NamedElement, PageModel, SiteModel } from "./types";

const VIEWPORT = { width: 1280, height: 800 };

async function namedList(locator: Locator, kind: "button" | "link"): Promise<NamedElement[]> {
  const count = Math.min(await locator.count(), 24);
  const out: NamedElement[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < count; i++) {
    const el = locator.nth(i);
    const name = ((await el.innerText().catch(() => "")) || (await el.getAttribute("aria-label")) || "").trim();
    const testId = (await el.getAttribute("data-test")) || undefined;
    const href = kind === "link" ? (await el.getAttribute("href")) || undefined : undefined;
    const key = `${name}|${testId}|${href}`;
    if (!name && !testId) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ name: name || testId || "unnamed", testId, href });
  }
  return out;
}

async function extractFields(page: Page): Promise<Field[]> {
  return page.$$eval("input, textarea, select", (els) =>
    els.slice(0, 20).map((el) => {
      const input = el as HTMLInputElement;
      return {
        name:
          input.getAttribute("name") ||
          input.getAttribute("id") ||
          input.getAttribute("data-test") ||
          input.getAttribute("placeholder") ||
          input.getAttribute("aria-label") ||
          input.type ||
          "field",
        type: input.type || el.tagName.toLowerCase(),
        testId: input.getAttribute("data-test") || undefined,
        placeholder: input.getAttribute("placeholder") || undefined,
      };
    }),
  );
}

async function loginIfNeeded(page: Page, username: string, password: string) {
  const user = page.locator('[data-test="username"], #user-name, input[type="text"], input[name="username"]').first();
  const pass = page.locator('[data-test="password"], #password, input[type="password"]').first();
  const submit = page.locator('[data-test="login-button"], #login-button, input[type="submit"], button[type="submit"]').first();
  if (!(await pass.count())) return false;
  await user.fill(username);
  await pass.fill(password);
  await submit.click();
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(500);
  return true;
}

async function screenshotPage(page: Page, projectId: string, filename: string) {
  const dir = artifactDiskDir(projectId);
  await mkdir(dir, { recursive: true });
  const disk = path.join(dir, filename);
  await page.screenshot({ path: disk, fullPage: false });
  return artifactPublicPath(projectId, filename);
}

async function extractPage(page: Page, projectId: string, statusCode: number): Promise<PageModel> {
  const url = page.url();
  const title = await page.title();
  const headings = await page.$$eval("h1, h2, h3", (els) =>
    els
      .map((el) => (el.textContent || "").trim())
      .filter(Boolean)
      .slice(0, 8),
  );
  const fields = await extractFields(page);
  const buttons = await namedList(page.locator('button, input[type="submit"]'), "button");
  const links = await namedList(page.getByRole("link"), "link");
  const classified = classifyPage({ url, title, headings, fields, buttons });
  const id = pageIdFromUrl(url);
  const shot = await screenshotPage(page, projectId, `page-${id}.png`);
  return {
    id,
    url,
    title,
    type: classified.type,
    purpose: classified.purpose,
    confidence: classified.confidence,
    headings,
    fields,
    buttons,
    links,
    screenshot: shot,
    statusCode,
    selected: classified.confidence !== "low",
  };
}

function sameOriginLinks(pageUrl: string, links: NamedElement[]) {
  const origin = new URL(pageUrl).origin;
  const urls: string[] = [];
  for (const link of links) {
    if (!link.href || link.href.startsWith("#")) continue;
    try {
      const next = new URL(link.href, pageUrl);
      if (next.origin !== origin) continue;
      if (next.protocol !== "http:" && next.protocol !== "https:") continue;
      urls.push(next.toString());
    } catch {
      /* ignore */
    }
  }
  return urls;
}

function buildFeatures(pages: PageModel[]): Feature[] {
  const byType = (type: PageModel["type"]) => pages.filter((p) => p.type === type).map((p) => p.id);
  const catalog: Array<Omit<Feature, "selected">> = [
    {
      id: "authentication",
      name: "Authentication",
      description: "Valid login, invalid login, empty fields, locked-out user.",
      pageIds: byType("Login"),
    },
    {
      id: "listing",
      name: "Product listing",
      description: "Catalog loads, products visible, sort, add to cart.",
      pageIds: byType("Listing"),
    },
    {
      id: "detail",
      name: "Product details",
      description: "Open a product and see its name, price, and add-to-cart.",
      pageIds: byType("Detail"),
    },
    {
      id: "cart",
      name: "Cart",
      description: "Added items persist; items can be removed.",
      pageIds: byType("Cart"),
    },
    {
      id: "checkout",
      name: "Checkout",
      description: "Fake checkout to confirmation. No real payment.",
      pageIds: byType("Checkout"),
    },
    {
      id: "navigation",
      name: "Navigation",
      description: "Menu, logout, and moving between catalog and cart.",
      pageIds: pages.map((p) => p.id),
    },
  ];
  return catalog
    .filter((f) => f.pageIds.length > 0 || f.id === "navigation")
    .map((f) => ({ ...f, selected: true }));
}

export async function runScan(projectId: string) {
  const project = await addLog(projectId, "Opening a cloud browser.");
  const browser = await launchBrowser();
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();

  try {
    let statusCode = 200;
    page.on("response", (res) => {
      if (res.url() === page.url() || res.url() === project.url) statusCode = res.status();
    });

    await addLog(projectId, `Visiting ${project.url}`);
    const response = await page.goto(project.url, { waitUntil: "domcontentloaded", timeout: 30000 });
    statusCode = response?.status() ?? statusCode;
    await page.waitForTimeout(400);

    const host = new URL(project.url).hostname;
    const html = await page.content();
    const fitness = probeFitness({ host, title: await page.title(), html, url: page.url() });

    if (!fitness.allowed) {
      await browser.close();
      await patchProject(projectId, (p) => ({
        ...p,
        status: "refused",
        siteModel: {
          gist: "This site is outside the Phase 1 certified class.",
          host,
          fitness,
          pages: [],
          features: [],
        },
      }));
      await addLog(projectId, `Refused: ${fitness.blockers.join(" ")}`);
      return;
    }

    await addLog(projectId, "Fitness check passed.");

    const pages: PageModel[] = [];
    const seen = new Set<string>();

    const passwordField = await page.locator("input[type='password']").count();
    if (passwordField) {
      await addLog(projectId, "Login page found. Capturing it before signing in.");
      const loginModel = await extractPage(page, projectId, statusCode);
      pages.push(loginModel);
      seen.add(templateKey(page.url()));
    }

    if (project.username && project.password && passwordField) {
      await addLog(projectId, "Signing in with the test user.");
      await loginIfNeeded(page, project.username, project.password);
      const error = page.locator('[data-test="error"], .error-message-container');
      if (await error.count()) {
        const msg = ((await error.innerText().catch(() => "")) || "").trim();
        if (msg && page.url().includes("saucedemo") && !page.url().includes("inventory")) {
          throw new Error(`Login failed: ${msg}`);
        }
      }
    }

    const queue: string[] = [page.url()];
    if (isSauceDemo(project.url)) {
      queue.push(
        "https://www.saucedemo.com/inventory.html",
        "https://www.saucedemo.com/inventory-item.html?id=4",
      );
    }

    while (queue.length && pages.length < 12) {
      const next = queue.shift();
      if (!next) break;
      const key = templateKey(next);
      if (seen.has(key)) continue;

      await addLog(projectId, `Reading ${new URL(next).pathname || "/"}`);
      const res = await page.goto(next, { waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => null);
      await page.waitForTimeout(350);
      const actual = templateKey(page.url());
      if (seen.has(actual)) {
        seen.add(key);
        continue;
      }
      seen.add(key);
      seen.add(actual);
      const code = res?.status() ?? 200;
      const model = await extractPage(page, projectId, code);
      pages.push(model);

      for (const href of sameOriginLinks(page.url(), model.links)) {
        const k = templateKey(href);
        if (!seen.has(k)) queue.push(href);
      }
    }

    if (isSauceDemo(project.url)) {
      await page.goto("https://www.saucedemo.com/inventory.html", { waitUntil: "domcontentloaded" });
      const add = page.locator('[data-test="add-to-cart-sauce-labs-backpack"]');
      if (await add.count()) await add.click();
      for (const dest of [
        "https://www.saucedemo.com/cart.html",
        "https://www.saucedemo.com/checkout-step-one.html",
      ]) {
        await addLog(projectId, `Reading ${new URL(dest).pathname}`);
        const res = await page.goto(dest, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(300);
        const actual = templateKey(page.url());
        if (!seen.has(actual)) {
          seen.add(actual);
          pages.push(await extractPage(page, projectId, res?.status() ?? 200));
        }
      }
      if (page.url().includes("checkout-step-one")) {
        await page.locator('[data-test="firstName"]').fill("Ada");
        await page.locator('[data-test="lastName"]').fill("Lovelace");
        await page.locator('[data-test="postalCode"]').fill("94043");
        await page.locator('[data-test="continue"]').click();
        await page.waitForTimeout(300);
        const key = templateKey(page.url());
        if (!seen.has(key)) {
          seen.add(key);
          await addLog(projectId, "Reading /checkout-step-two.html");
          pages.push(await extractPage(page, projectId, 200));
        }
      }
    }

    const features = buildFeatures(pages);
    const siteModel: SiteModel = {
      gist: gistFor(pages, host),
      host,
      fitness,
      pages,
      features,
    };

    await patchProject(projectId, (p) => ({
      ...p,
      status: "review",
      name: pages.find((x) => x.type === "Listing")?.title || pages[0]?.title || p.name,
      siteModel,
    }));
    await addLog(projectId, `Map ready. ${pages.length} page templates.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scan failed";
    await patchProject(projectId, (p) => ({ ...p, status: "error", error: message }));
    await addLog(projectId, message);
  } finally {
    await browser.close();
  }
}
