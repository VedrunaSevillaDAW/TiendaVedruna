type WishlistState = {
  // Lista de productos guardados como favoritos.
  items: any[];
};

// Clave de almacenamiento local para wishlist.
const STORAGE_KEY = "items-wishlist";

const readState = (): WishlistState => {
  // En SSR no hay window: devuelve estado vacio seguro.
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
  // Persiste la wishlist y notifica cambios al resto de scripts.
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("wishlist:updated", { detail: state }));
};

// Devuelve todos los elementos favoritos.
export const getWishlistItems = () => readState().items;

// Comprueba si un producto ya existe en wishlist.
export const isInWishlist = (id: string) =>
  readState().items.some((item) => `${item.id}` === `${id}`);

// Anade o elimina un producto de wishlist.
export const toggleWishlistItem = (product: any) => {
  const state = readState();
  const exists = state.items.some((item) => `${item.id}` === `${product.id}`);

  const nextItems = exists
    ? state.items.filter((item) => `${item.id}` !== `${product.id}`)
    : [...state.items, product];

  writeState({ items: nextItems });
};
