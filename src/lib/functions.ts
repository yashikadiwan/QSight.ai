import type { PageModel, PageType } from "./types";

export type PageFunction = {
  id: string;
  pageType: PageType;
  label: string;
};

const FUNCTIONS: Record<PageType, PageFunction[]> = {
  Login: [
    { id: "valid-login", pageType: "Login", label: "Sign in with a valid user" },
    { id: "invalid-password", pageType: "Login", label: "Reject a wrong password" },
    { id: "empty-login", pageType: "Login", label: "Show an error when fields are empty" },
    { id: "locked-out", pageType: "Login", label: "Block a locked-out user" },
  ],
  Listing: [
    { id: "inventory-loads", pageType: "Listing", label: "Catalog loads with products" },
    { id: "add-to-cart-badge", pageType: "Listing", label: "Add a product to the cart" },
    { id: "remove-from-listing", pageType: "Listing", label: "Remove a product from the catalog" },
    { id: "sort-price-asc", pageType: "Listing", label: "Sort products by price" },
  ],
  Detail: [
    { id: "open-product", pageType: "Detail", label: "Open a product and see name, price, and add to cart" },
  ],
  Cart: [
    { id: "cart-persists", pageType: "Cart", label: "Added items stay in the cart" },
    { id: "cart-remove", pageType: "Cart", label: "Remove an item from the cart" },
  ],
  Checkout: [
    { id: "checkout-complete", pageType: "Checkout", label: "Complete checkout to confirmation" },
  ],
  Other: [
    { id: "logout", pageType: "Other", label: "Open the menu and log out" },
  ],
};

export function functionsForPage(page: PageModel): PageFunction[] {
  const list = [...(FUNCTIONS[page.type] || [])];
  if (page.buttons.some((b) => /menu|logout|open/i.test(b.name)) || page.type === "Listing") {
    if (!list.some((f) => f.id === "logout")) {
      list.push({ id: "logout", pageType: page.type, label: "Open the menu and log out" });
    }
  }
  return list;
}

function cleanName(name: string) {
  return name.replace(/\s+/g, " ").trim();
}

export function observedActions(page: PageModel): string[] {
  const skip = /^(facebook|twitter|linkedin|ok|×|x|\d+)$/i;
  const items = [
    ...page.fields.map((f) => cleanName(f.placeholder || f.name)),
    ...page.buttons.map((b) => cleanName(b.name)),
    ...page.links.map((l) => cleanName(l.name)),
  ].filter((name) => name && name.length < 42 && !skip.test(name));

  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of items) {
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
    if (out.length >= 10) break;
  }
  return out;
}

export function wantsRescan(text: string) {
  return /\b(again|re-?read|re-?scan|miss(ed|ing)?|forgot|not (there|found|listed)|look again|read the site)\b/i.test(
    text,
  );
}
