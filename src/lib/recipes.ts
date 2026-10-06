import type { FeatureId, SiteModel, TestCase } from "./types";

type Recipe = Omit<TestCase, "selected">;

const RECIPES: Recipe[] = [
  {
    id: "TC-LOGIN-001",
    featureId: "authentication",
    recipe: "valid-login",
    title: "Valid user can sign in",
    steps: [
      "Open the login page",
      "Enter standard_user and secret_sauce",
      "Click Login",
    ],
    expected: "The product catalog is shown.",
  },
  {
    id: "TC-LOGIN-002",
    featureId: "authentication",
    recipe: "invalid-password",
    title: "Wrong password is rejected",
    steps: [
      "Open the login page",
      "Enter standard_user and a wrong password",
      "Click Login",
    ],
    expected: "An error message is shown and the catalog is not opened.",
  },
  {
    id: "TC-LOGIN-003",
    featureId: "authentication",
    recipe: "empty-login",
    title: "Empty login shows validation",
    steps: ["Open the login page", "Leave both fields empty", "Click Login"],
    expected: "A validation error is shown.",
  },
  {
    id: "TC-LOGIN-004",
    featureId: "authentication",
    recipe: "locked-out",
    title: "Locked-out user cannot sign in",
    steps: [
      "Open the login page",
      "Enter locked_out_user and secret_sauce",
      "Click Login",
    ],
    expected: "A locked-out error is shown.",
  },
  {
    id: "TC-INV-001",
    featureId: "listing",
    recipe: "inventory-loads",
    title: "Catalog shows six products",
    steps: ["Sign in", "Open the inventory"],
    expected: "Exactly six product cards are visible, each with a name and price.",
  },
  {
    id: "TC-INV-002",
    featureId: "listing",
    recipe: "add-to-cart-badge",
    title: "Adding a product updates the cart badge",
    steps: ["Sign in", "Click Add to cart on Sauce Labs Backpack"],
    expected: "The cart badge shows 1.",
  },
  {
    id: "TC-INV-003",
    featureId: "listing",
    recipe: "remove-from-listing",
    title: "A product can be removed from the catalog",
    steps: ["Sign in", "Add Sauce Labs Backpack", "Click Remove"],
    expected: "The cart badge is gone and the button returns to Add to cart.",
  },
  {
    id: "TC-INV-004",
    featureId: "listing",
    recipe: "sort-price-asc",
    title: "Sort by price, low to high",
    steps: ["Sign in", "Choose Price (low to high)"],
    expected: "The first product is cheaper than or equal to the last.",
  },
  {
    id: "TC-PDP-001",
    featureId: "detail",
    recipe: "open-product",
    title: "Product details open from the catalog",
    steps: ["Sign in", "Click Sauce Labs Backpack"],
    expected: "The detail page shows the backpack name and an add-to-cart button.",
  },
  {
    id: "TC-CART-001",
    featureId: "cart",
    recipe: "cart-persists",
    title: "Cart keeps an added item",
    steps: ["Sign in", "Add Sauce Labs Backpack", "Open the cart"],
    expected: "The backpack is listed in the cart.",
  },
  {
    id: "TC-CART-002",
    featureId: "cart",
    recipe: "cart-remove",
    title: "An item can be removed from the cart",
    steps: ["Sign in", "Add Sauce Labs Backpack", "Open the cart", "Click Remove"],
    expected: "The cart is empty.",
  },
  {
    id: "TC-CHK-001",
    featureId: "checkout",
    recipe: "checkout-complete",
    title: "Checkout completes with demo data",
    steps: [
      "Sign in",
      "Add Sauce Labs Backpack",
      "Open cart and checkout",
      "Enter first name, last name, and postal code",
      "Continue and finish",
    ],
    expected: "The confirmation page says Thank you for your order.",
  },
  {
    id: "TC-NAV-001",
    featureId: "navigation",
    recipe: "logout",
    title: "Logout returns to the login page",
    steps: ["Sign in", "Open the menu", "Click Logout"],
    expected: "The login form is shown again.",
  },
];

export function instantiateCases(model: SiteModel, recipeIds?: string[]): TestCase[] {
  if (recipeIds?.length) {
    const wanted = new Set(recipeIds);
    return RECIPES.filter((recipe) => wanted.has(recipe.recipe)).map((recipe) => ({
      ...recipe,
      selected: true,
    }));
  }

  const selected = new Set(model.features.filter((f) => f.selected).map((f) => f.id));
  const has = (id: FeatureId) =>
    selected.has(id) &&
    (id === "navigation" ||
      model.pages.some((p) => p.selected && p.type === featureToType(id)));

  return RECIPES.filter((recipe) => has(recipe.featureId)).map((recipe) => ({
    ...recipe,
    selected: true,
  }));
}

function featureToType(id: FeatureId) {
  switch (id) {
    case "authentication":
      return "Login" as const;
    case "listing":
      return "Listing" as const;
    case "detail":
      return "Detail" as const;
    case "cart":
      return "Cart" as const;
    case "checkout":
      return "Checkout" as const;
    default:
      return "Other" as const;
  }
}
