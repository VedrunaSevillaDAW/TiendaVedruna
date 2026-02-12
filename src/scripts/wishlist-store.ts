type WishlistState = {
  items: any[];
};

const STORAGE_KEY = "items-wishlist";

const readState = (): WishlistState => {
  if (typeof window === "undefined") return { items: [] };

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return { items: [] };

  try {
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.items)) {
      return parsed;
    }
  } catch {
    return { items: [] };
  }

  return { items: [] };
};

const writeState = (state: WishlistState) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("wishlist:updated", { detail: state }));
};

export const getWishlistItems = () => readState().items;

export const isInWishlist = (id: string) =>
  readState().items.some((item) => `${item.id}` === `${id}`);

export const toggleWishlistItem = (product: any) => {
  const state = readState();
  const exists = state.items.some((item) => `${item.id}` === `${product.id}`);

  const nextItems = exists
    ? state.items.filter((item) => `${item.id}` !== `${product.id}`)
    : [...state.items, product];

  writeState({ items: nextItems });
};
