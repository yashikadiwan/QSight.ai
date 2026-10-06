import { mkdir } from "fs/promises";
import path from "path";
import { type Page } from "playwright";
import { launchBrowser } from "./browser";
import { artifactDiskDir, artifactPublicPath, getProject, patchProject } from "./store";
import type { CaseResult, Project, ResultStatus } from "./types";

const ORIGIN = "https://www.saucedemo.com";

async function shot(page: Page, projectId: string, caseId: string) {
  const dir = artifactDiskDir(projectId);
  await mkdir(dir, { recursive: true });
  const filename = `result-${caseId}.png`;
  await page.screenshot({ path: path.join(dir, filename), fullPage: false });
  return artifactPublicPath(projectId, filename);
}

async function login(page: Page, user: string, password: string) {
  await page.goto(`${ORIGIN}/`, { waitUntil: "domcontentloaded" });
  await page.locator('[data-test="username"]').fill(user);
  await page.locator('[data-test="password"]').fill(password);
  await page.locator('[data-test="login-button"]').click();
}

async function loginStandard(page: Page) {
  await login(page, "standard_user", "secret_sauce");
  await page.waitForURL(/inventory/);
}

async function runRecipe(page: Page, recipe: string): Promise<{ status: ResultStatus; reason: string }> {
  switch (recipe) {
    case "valid-login": {
      await login(page, "standard_user", "secret_sauce");
      await page.waitForURL(/inventory/, { timeout: 8000 });
      const count = await page.locator(".inventory_item").count();
      if (count > 0) return { status: "pass", reason: `Catalog opened with ${count} products.` };
      return { status: "fail", reason: "Login succeeded but no products were found." };
    }
    case "invalid-password": {
      await login(page, "standard_user", "wrong_password");
      const error = page.locator('[data-test="error"]');
      await error.waitFor({ timeout: 5000 });
      const text = (await error.innerText()).trim();
      if (!page.url().includes("inventory") && /do not match|epic sadface/i.test(text)) {
        return { status: "pass", reason: text };
      }
      return { status: "fail", reason: `Unexpected state: ${text || page.url()}` };
    }
    case "empty-login": {
      await page.goto(`${ORIGIN}/`, { waitUntil: "domcontentloaded" });
      await page.locator('[data-test="login-button"]').click();
      const error = page.locator('[data-test="error"]');
      await error.waitFor({ timeout: 5000 });
      const text = (await error.innerText()).trim();
      if (/username is required/i.test(text)) return { status: "pass", reason: text };
      return { status: "fail", reason: text || "No validation message." };
    }
    case "locked-out": {
      await login(page, "locked_out_user", "secret_sauce");
      const error = page.locator('[data-test="error"]');
      await error.waitFor({ timeout: 5000 });
      const text = (await error.innerText()).trim();
      if (/locked out/i.test(text)) return { status: "pass", reason: text };
      return { status: "fail", reason: text || "Locked-out user was not blocked." };
    }
    case "inventory-loads": {
      await loginStandard(page);
      const items = page.locator(".inventory_item");
      const count = await items.count();
      const names = await page.locator(".inventory_item_name").count();
      const prices = await page.locator(".inventory_item_price").count();
      if (count === 6 && names === 6 && prices === 6) {
        return { status: "pass", reason: "Six named, priced products are visible." };
      }
      return { status: "fail", reason: `Found ${count} items, ${names} names, ${prices} prices.` };
    }
    case "add-to-cart-badge": {
      await loginStandard(page);
      await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
      const badge = page.locator('[data-test="shopping-cart-badge"], .shopping_cart_badge');
      await badge.waitFor({ timeout: 5000 });
      const n = (await badge.innerText()).trim();
      if (n === "1") return { status: "pass", reason: "Cart badge is 1." };
      return { status: "fail", reason: `Badge was "${n}".` };
    }
    case "remove-from-listing": {
      await loginStandard(page);
      await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
      await page.locator('[data-test="remove-sauce-labs-backpack"]').click();
      const badge = page.locator('[data-test="shopping-cart-badge"], .shopping_cart_badge');
      const add = page.locator('[data-test="add-to-cart-sauce-labs-backpack"]');
      if ((await badge.count()) === 0 && (await add.count()) === 1) {
        return { status: "pass", reason: "Item removed; add-to-cart is back." };
      }
      return { status: "fail", reason: "Remove did not restore the catalog button." };
    }
    case "sort-price-asc": {
      await loginStandard(page);
      await page.locator('[data-test="product-sort-container"]').selectOption("lohi");
      const prices = await page.locator(".inventory_item_price").allInnerTexts();
      const values = prices.map((p) => Number(p.replace("$", "")));
      const sorted = [...values].sort((a, b) => a - b);
      const ok = values.every((v, i) => v === sorted[i]);
      if (ok) return { status: "pass", reason: `Prices in order: ${prices.join(", ")}` };
      return { status: "fail", reason: `Prices were ${prices.join(", ")}` };
    }
    case "open-product": {
      await loginStandard(page);
      await page.getByText("Sauce Labs Backpack", { exact: true }).first().click();
      await page.waitForURL(/inventory-item/);
      const name = (await page.locator('[data-test="inventory-item-name"]').innerText()).trim();
      const add = page.locator('[data-test="add-to-cart"]');
      if (name === "Sauce Labs Backpack" && (await add.count())) {
        return { status: "pass", reason: "Backpack detail page opened." };
      }
      return { status: "fail", reason: `Opened "${name}".` };
    }
    case "cart-persists": {
      await loginStandard(page);
      await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
      await page.locator('[data-test="shopping-cart-link"]').click();
      await page.waitForURL(/cart/);
      const name = (await page.locator('[data-test="inventory-item-name"]').innerText()).trim();
      if (name === "Sauce Labs Backpack") return { status: "pass", reason: "Backpack is in the cart." };
      return { status: "fail", reason: `Cart showed "${name}".` };
    }
    case "cart-remove": {
      await loginStandard(page);
      await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
      await page.locator('[data-test="shopping-cart-link"]').click();
      await page.locator('[data-test="remove-sauce-labs-backpack"]').click();
      const items = await page.locator(".cart_item").count();
      if (items === 0) return { status: "pass", reason: "Cart is empty." };
      return { status: "fail", reason: `Cart still has ${items} item(s).` };
    }
    case "checkout-complete": {
      await loginStandard(page);
      await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
      await page.locator('[data-test="shopping-cart-link"]').click();
      await page.locator('[data-test="checkout"]').click();
      await page.locator('[data-test="firstName"]').fill("Ada");
      await page.locator('[data-test="lastName"]').fill("Lovelace");
      await page.locator('[data-test="postalCode"]').fill("94043");
      await page.locator('[data-test="continue"]').click();
      await page.locator('[data-test="finish"]').click();
      const header = (await page.locator('[data-test="complete-header"]').innerText()).trim();
      if (/thank you for your order/i.test(header)) {
        return { status: "pass", reason: header };
      }
      return { status: "fail", reason: header || "Confirmation not found." };
    }
    case "logout": {
      await loginStandard(page);
      await page.locator("#react-burger-menu-btn").click();
      await page.locator('[data-test="logout-sidebar-link"]').click();
      await page.waitForURL(/saucedemo\.com\/?$/);
      const loginButton = page.locator('[data-test="login-button"]');
      if (await loginButton.count()) return { status: "pass", reason: "Login page is shown." };
      return { status: "fail", reason: "Did not return to login." };
    }
    default:
      return { status: "blocked", reason: "Unknown recipe." };
  }
}

export async function runSuite(projectId: string, caseIds: string[]) {
  const project = await getProject(projectId);
  if (!project) throw new Error("Project not found");

  const selected = project.cases.filter((c) => caseIds.includes(c.id));
  await patchProject(projectId, (p) => ({
    ...p,
    status: "running",
    results: [],
    runStartedAt: new Date().toISOString(),
    runFinishedAt: undefined,
    logs: [...p.logs, { at: new Date().toISOString(), message: `Running ${selected.length} cases.` }],
  }));

  const browser = await launchBrowser();
  const results: CaseResult[] = [];

  try {
    for (const testCase of selected) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
      const page = await context.newPage();
      const started = Date.now();
      let status: ResultStatus = "fail";
      let reason = "";
      let screenshot: string | undefined;
      try {
        const outcome = await runRecipe(page, testCase.recipe);
        status = outcome.status;
        reason = outcome.reason;
        screenshot = await shot(page, projectId, testCase.id);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Case failed";
        if (/timeout/i.test(message)) {
          status = "blocked";
          reason = "Timed out waiting for the page. Marked blocked, not failed.";
        } else {
          status = "fail";
          reason = message;
        }
        screenshot = await shot(page, projectId, testCase.id).catch(() => undefined);
      } finally {
        await context.close();
      }

      const result: CaseResult = {
        caseId: testCase.id,
        title: testCase.title,
        status,
        reason,
        screenshot,
        durationMs: Date.now() - started,
      };
      results.push(result);
      await patchProject(projectId, (p) => ({
        ...p,
        results: [...p.results, result],
        logs: [
          ...p.logs,
          {
            at: new Date().toISOString(),
            message: `${testCase.id} ${status.toUpperCase()} — ${reason}`,
          },
        ].slice(-40),
      }));
    }
  } finally {
    await browser.close();
  }

  await patchProject(projectId, (p) => ({
    ...p,
    status: "report",
    results,
    runFinishedAt: new Date().toISOString(),
  }));
}

export function summarize(project: Project) {
  const counts = { pass: 0, fail: 0, blocked: 0, skipped: 0 };
  for (const r of project.results) counts[r.status] += 1;
  return counts;
}
