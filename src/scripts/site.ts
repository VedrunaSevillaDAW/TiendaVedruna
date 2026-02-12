const getWishlistCount = () => {
  const raw = window.localStorage.getItem("items-wishlist");
  if (!raw) return 0;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.items)) {
      return parsed.items.length;
    }
  } catch {
    return 0;
  }
  return 0;
};

const updateAuthState = () => {
  const username = window.localStorage.getItem("username");
  const loggedIn = Boolean(username);

  const loggedInEl = document.querySelector<HTMLElement>("[data-auth-logged-in]");
  const guestEl = document.querySelector<HTMLElement>("[data-auth-guest]");
  const usernameEl = document.querySelector<HTMLElement>("[data-username]");

  if (loggedInEl) loggedInEl.classList.toggle("hidden", !loggedIn);
  if (guestEl) guestEl.classList.toggle("hidden", loggedIn);
  if (usernameEl) usernameEl.textContent = username ?? "";

  document
    .querySelectorAll<HTMLElement>("[data-auth-required]")
    .forEach((el) => el.classList.toggle("hidden", !loggedIn));
};

const updateWishlistIndicator = () => {
  const hasItems = getWishlistCount() > 0;
  document
    .querySelectorAll<HTMLElement>("[data-wishlist-indicator]")
    .forEach((el) => el.classList.toggle("hidden", !hasItems));
};

const updateCartIndicator = (count: number) => {
  const hasItems = count > 0;
  document
    .querySelectorAll<HTMLElement>("[data-cart-indicator]")
    .forEach((el) => el.classList.toggle("hidden", !hasItems));
};

const getCartQuantity = () => {
  const quantity = window.simpleCart?.quantity?.();
  if (typeof quantity !== "number" || Number.isNaN(quantity)) {
    return 0;
  }
  return quantity;
};

const openCartPanel = () => {
  const panel = document.querySelector<HTMLElement>("[data-cart-panel]");
  const backdrop = document.querySelector<HTMLElement>("[data-cart-backdrop]");
  if (!panel || !backdrop) return;

  panel.classList.remove("translate-x-full");
  backdrop.classList.remove("opacity-0", "pointer-events-none");
};

const closeCartPanel = () => {
  const panel = document.querySelector<HTMLElement>("[data-cart-panel]");
  const backdrop = document.querySelector<HTMLElement>("[data-cart-backdrop]");
  if (!panel || !backdrop) return;

  panel.classList.add("translate-x-full");
  backdrop.classList.add("opacity-0", "pointer-events-none");
};

const setCartMessage = (message: string, isError = false) => {
  const messageEl = document.querySelector<HTMLElement>("[data-cart-message]");
  if (!messageEl) return;

  messageEl.textContent = message;
  messageEl.classList.remove("hidden");
  messageEl.classList.toggle("text-red-600", isError);
  messageEl.classList.toggle("text-[#4a4a4a]", !isError);
};

const clearCartMessage = () => {
  const messageEl = document.querySelector<HTMLElement>("[data-cart-message]");
  if (!messageEl) return;
  messageEl.textContent = "";
  messageEl.classList.add("hidden");
  messageEl.classList.remove("text-red-600");
  messageEl.classList.add("text-[#4a4a4a]");
};

const getCheckoutPayload = () => {
  const cart = window.simpleCart;
  if (typeof cart?.items !== "function") return null;

  const rawItems = cart.items();
  if (!Array.isArray(rawItems)) return null;

  const items = rawItems.map((item: any) => ({
    id: String(item.get("id") ?? ""),
    name: String(item.get("name") ?? ""),
    price: Number(item.get("price") ?? 0),
    quantity: Number(item.get("quantity") ?? 0),
    image: String(item.get("image") ?? item.get("thumb") ?? ""),
  }));

  const filteredItems = items.filter(
    (item) => item.id && item.name && item.price > 0 && item.quantity > 0
  );

  return {
    items: filteredItems,
    total: Number(cart.total?.() ?? 0),
    quantity: Number(cart.quantity?.() ?? 0),
    username: window.localStorage.getItem("username") ?? null,
    createdAt: new Date().toISOString(),
  };
};

const handleCheckout = async () => {
  clearCartMessage();
  const checkoutButton = document.querySelector<HTMLButtonElement>(
    "[data-cart-checkout]"
  );

  const payload = getCheckoutPayload();
  if (!payload || payload.items.length === 0) {
    setCartMessage("El carrito está vacío.", true);
    return;
  }

  if (checkoutButton) checkoutButton.disabled = true;
  if (checkoutButton) checkoutButton.textContent = "Procesando...";

  try {
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body?.message ?? "No se pudo completar la compra.");
    }

    window.simpleCart?.empty?.();
    setCartMessage("Compra enviada correctamente.");
    window.setTimeout(() => {
      clearCartMessage();
      closeCartPanel();
    }, 1200);
  } catch (error: any) {
    setCartMessage(error?.message ?? "Error al procesar la compra.", true);
  } finally {
    if (checkoutButton) checkoutButton.disabled = false;
    if (checkoutButton) checkoutButton.textContent = "Comprar";
  }
};

const initCartButton = () => {
  const button = document.querySelector<HTMLButtonElement>("[data-cart-button]");
  const closeButton = document.querySelector<HTMLButtonElement>("[data-cart-close]");
  const emptyButton = document.querySelector<HTMLButtonElement>("[data-cart-empty]");
  const checkoutButton = document.querySelector<HTMLButtonElement>(
    "[data-cart-checkout]"
  );
  const backdrop = document.querySelector<HTMLElement>("[data-cart-backdrop]");

  button?.addEventListener("click", () => {
    const panel = document.querySelector<HTMLElement>("[data-cart-panel]");
    const isOpen = panel ? !panel.classList.contains("translate-x-full") : false;
    if (isOpen) {
      closeCartPanel();
      return;
    }
    openCartPanel();
  });

  closeButton?.addEventListener("click", closeCartPanel);
  backdrop?.addEventListener("click", closeCartPanel);
  checkoutButton?.addEventListener("click", handleCheckout);
  emptyButton?.addEventListener("click", () => {
    clearCartMessage();
    window.simpleCart?.empty?.();
  });
};

const initSimpleCart = () => {
  const cart = window.simpleCart;
  if (typeof cart !== "function") return;

  cart({
    cartStyle: "table",
    cartColumns: [
      {
        attr: "name",
        label: "Producto",
        view: (item: any, column: any) => {
          const rawName = item.get(column.attr) ?? "";
          const rawImage = item.get("image") ?? item.get("thumb") ?? "";
          const name = String(rawName)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
          const image = String(rawImage).replace(/"/g, "&quot;");

          return `<div class="cart-product-cell"><img class="cart-product-thumb" src="${image}" alt="${name}" onerror="this.onerror=null;this.src='/img/LOGO2.png'" /><span class="item-name">${name}</span></div>`;
        },
      },
      { attr: "price", label: "Precio", view: "currency" },
      { view: "decrement", label: false },
      { attr: "quantity", label: "Uds" },
      { view: "increment", label: false },
      { attr: "total", label: "Total", view: "currency" },
      { view: "remove", text: "x", label: false },
    ],
  });

  cart.ready(() => {
    updateCartIndicator(getCartQuantity());

    cart.bind("update", () => {
      updateCartIndicator(getCartQuantity());
    });
  });
};

window.addEventListener("DOMContentLoaded", () => {
  updateAuthState();
  updateWishlistIndicator();
  initCartButton();
  initSimpleCart();
});

window.addEventListener("storage", () => {
  updateAuthState();
  updateWishlistIndicator();
});

window.addEventListener("wishlist:updated", updateWishlistIndicator);
window.addEventListener("cart:open", openCartPanel);
