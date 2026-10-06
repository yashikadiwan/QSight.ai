import type { Confidence, Field, NamedElement, PageModel, PageType } from "./types";

function includesAny(hay: string, needles: string[]) {
  const h = hay.toLowerCase();
  return needles.some((n) => h.includes(n));
}

export function classifyPage(input: {
  url: string;
  title: string;
  headings: string[];
  fields: Field[];
  buttons: NamedElement[];
}): { type: PageType; purpose: string; confidence: Confidence } {
  const url = input.url.toLowerCase();
  const blob = `${input.title} ${input.headings.join(" ")}`.toLowerCase();
  const fieldNames = input.fields.map((f) => f.name.toLowerCase()).join(" ");
  const buttonNames = input.buttons.map((b) => b.name.toLowerCase()).join(" ");

  if (url.includes("checkout-complete")) {
    return {
      type: "Checkout",
      purpose: "Order confirmation after a completed checkout.",
      confidence: "high",
    };
  }
  if (url.includes("checkout")) {
    return {
      type: "Checkout",
      purpose: "Collects or reviews order details before purchase.",
      confidence: "high",
    };
  }
  if (url.includes("cart")) {
    return {
      type: "Cart",
      purpose: "Shows items the user intends to buy.",
      confidence: "high",
    };
  }
  if (url.includes("inventory-item") || url.includes("product")) {
    return {
      type: "Detail",
      purpose: "A single product with add-to-cart.",
      confidence: "high",
    };
  }
  if (url.includes("inventory") || includesAny(blob, ["products", "catalog"])) {
    return {
      type: "Listing",
      purpose: "Product catalog the user can sort, open, and add to cart.",
      confidence: "high",
    };
  }

  const hasPassword = input.fields.some((f) => f.type === "password");
  const hasUser =
    includesAny(fieldNames, ["user", "email", "login"]) ||
    input.fields.some((f) => f.type === "text" || f.type === "email");
  if (hasPassword && hasUser) {
    return {
      type: "Login",
      purpose: "Sign in with a username and password.",
      confidence: "high",
    };
  }

  if (includesAny(buttonNames, ["login", "sign in"]) && hasPassword) {
    return {
      type: "Login",
      purpose: "Sign in with a username and password.",
      confidence: "high",
    };
  }

  return {
    type: "Other",
    purpose: "Page captured, but it does not match a Phase 1 recipe type.",
    confidence: "medium",
  };
}

export function templateKey(url: string) {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/+$/, "") || "/";
    if (path.includes("inventory-item")) return `${u.origin}/inventory-item.html`;
    return `${u.origin}${path}`;
  } catch {
    return url;
  }
}

export function pageIdFromUrl(url: string) {
  return templateKey(url)
    .replace(/^https?:\/\//, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function gistFor(pages: PageModel[], host: string) {
  if (host.includes("saucedemo")) {
    return "Swag Labs is a small demo shop used for test automation. After login it shows six products, a cart, and a fake checkout. There is no real payment, no CAPTCHA, and no third-party widgets. Phase 1 can certify authentication, catalog, cart, checkout, and navigation.";
  }
  const types = [...new Set(pages.map((p) => p.type))].join(", ");
  return `${host} was crawled as ${pages.length} page template${pages.length === 1 ? "" : "s"} (${types || "unknown"}).`;
}
