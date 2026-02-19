// Cuenta elementos guardados en wishlist desde localStorage.
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

// Sincroniza estado de autenticacion si la URL trae datos del callback OAuth.
const syncAuthFromUrl = () => {
  const currentUrl = new URL(window.location.href);
  const authUser = currentUrl.searchParams.get("auth_user");
  const authError = currentUrl.searchParams.get("auth_error");

  if (authUser) {
    // Persiste usuario para que la UI lo reconozca como logueado.
    window.localStorage.setItem("username", authUser);
    window.dispatchEvent(new Event("storage"));
  }

  if (authError) {
    console.error("Login callback error:", authError);
  }

  if (authUser || authError) {
    // Limpia parametros temporales de la barra de direcciones.
    currentUrl.searchParams.delete("auth_user");
    currentUrl.searchParams.delete("auth_error");
    const cleanPath = `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;
    window.history.replaceState({}, "", cleanPath);
  }
};

// Actualiza bloques de UI que dependen del login.
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
    .forEach((el) => {
      el.classList.toggle("hidden", !loggedIn);
      el.toggleAttribute("hidden", !loggedIn);
    });
};

// Enciende/apaga el punto de indicador de wishlist.
const updateWishlistIndicator = () => {
  const hasItems = getWishlistCount() > 0;
  document
    .querySelectorAll<HTMLElement>("[data-wishlist-indicator]")
    .forEach((el) => el.classList.toggle("hidden", !hasItems));
};

// Enciende/apaga el punto de indicador de carrito.
const updateCartIndicator = (count: number) => {
  const hasItems = count > 0;
  document
    .querySelectorAll<HTMLElement>("[data-cart-indicator]")
    .forEach((el) => el.classList.toggle("hidden", !hasItems));
};

// Lee cantidad total actual del carrito simpleCart.
const getCartQuantity = () => {
  const quantity = window.simpleCart?.quantity?.();
  if (typeof quantity !== "number" || Number.isNaN(quantity)) {
    return 0;
  }
  return quantity;
};

// Abre panel lateral del carrito.
const openCartPanel = () => {
  const panel = document.querySelector<HTMLElement>("[data-cart-panel]");
  const backdrop = document.querySelector<HTMLElement>("[data-cart-backdrop]");
  if (!panel || !backdrop) return;

  panel.classList.remove("translate-x-full");
  backdrop.classList.remove("opacity-0", "pointer-events-none");
};

// Cierra panel lateral del carrito.
const closeCartPanel = () => {
  const panel = document.querySelector<HTMLElement>("[data-cart-panel]");
  const backdrop = document.querySelector<HTMLElement>("[data-cart-backdrop]");
  if (!panel || !backdrop) return;

  panel.classList.add("translate-x-full");
  backdrop.classList.add("opacity-0", "pointer-events-none");
};

// Muestra mensaje informativo/error en pie del panel.
const setCartMessage = (message: string, isError = false) => {
  const messageEl = document.querySelector<HTMLElement>("[data-cart-message]");
  if (!messageEl) return;

  messageEl.textContent = message;
  messageEl.classList.remove("hidden");
  messageEl.classList.toggle("text-red-600", isError);
  messageEl.classList.toggle("text-[#4a4a4a]", !isError);
};

// Limpia mensaje de estado del carrito.
const clearCartMessage = () => {
  const messageEl = document.querySelector<HTMLElement>("[data-cart-message]");
  if (!messageEl) return;
  messageEl.textContent = "";
  messageEl.classList.add("hidden");
  messageEl.classList.remove("text-red-600");
  messageEl.classList.add("text-[#4a4a4a]");
};

type RedsysCheckoutPayment = {
  orderId: number | null;
  url: string;
  ds_SignatureVersion: string;
  ds_MerchantParameters: string;
  ds_Signature: string;
};

type PaymentStatusResponse = {
  id: number;
  status: "PENDING" | "PAID" | "FAILED" | string;
};

const submitRedsysForm = (payment: RedsysCheckoutPayment) => {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = payment.url;
  form.style.display = "none";

  const fields: Record<string, string> = {
    Ds_SignatureVersion: payment.ds_SignatureVersion,
    Ds_MerchantParameters: payment.ds_MerchantParameters,
    Ds_Signature: payment.ds_Signature,
  };

  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
};

const clearCartClientSide = () => {
  if (typeof window.simpleCart?.empty === "function") {
    window.simpleCart.empty();
  }

  const keysToRemove: string[] = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith("simpleCart")) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => window.localStorage.removeItem(key));
};

const handlePaymentQueryOnHome = () => {
  const currentUrl = new URL(window.location.href);
  const payment = currentUrl.searchParams.get("payment");

  if (!payment) return;

  if (payment === "success") {
    clearCartClientSide();
    window.localStorage.removeItem("lastPaymentOrderId");
  }

  currentUrl.searchParams.delete("payment");
  const cleanPath = `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;
  window.history.replaceState({}, "", cleanPath);
};

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

const pollPaymentStatus = async (orderId: string) => {
  const maxAttempts = 6;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const response = await fetch(`/api/checkout/status/${orderId}`);
    if (response.ok) {
      const body = (await response.json()) as PaymentStatusResponse;
      if (body.status === "PAID" || body.status === "FAILED") {
        return body.status;
      }
    }

    if (attempt < maxAttempts - 1) {
      await sleep(1200);
    }
  }

  return "PENDING";
};

const handlePaymentReturn = async () => {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  if (path !== "/pago/ok" && path !== "/pago/ko") {
    return;
  }

  const orderId = window.localStorage.getItem("lastPaymentOrderId");

  if (path === "/pago/ko") {
    window.location.replace("/?payment=cancelled");
    return;
  }

  if (!orderId) {
    clearCartClientSide();
    window.location.replace("/?payment=success");
    return;
  }

  try {
    const status = await pollPaymentStatus(orderId);

    if (status === "FAILED") {
      window.location.replace("/?payment=failed");
      return;
    }

    clearCartClientSide();
    window.localStorage.removeItem("lastPaymentOrderId");
    window.location.replace("/?payment=success");
  } catch {
    clearCartClientSide();
    window.localStorage.removeItem("lastPaymentOrderId");
    window.location.replace("/?payment=success");
  }
};

// Construye payload normalizado para enviar checkout al backend.
const getCheckoutPayload = () => {
  const username = window.localStorage.getItem("username");
  if (!username) return null;

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

  // Incluye metadata basica para trazabilidad de compra.
  return {
    items: filteredItems,
    total: Number(cart.total?.() ?? 0),
    quantity: Number(cart.quantity?.() ?? 0),
    username,
    createdAt: new Date().toISOString(),
  };
};

// Ejecuta flujo de compra: validar, enviar y refrescar UI.
const handleCheckout = async () => {
  clearCartMessage();
  const checkoutButton = document.querySelector<HTMLButtonElement>(
    "[data-cart-checkout]"
  );

  const payload = getCheckoutPayload();
  if (!payload || payload.items.length === 0) {
    const hasSession = Boolean(window.localStorage.getItem("username"));
    setCartMessage(
      hasSession ? "El carrito esta vacio." : "Debes iniciar sesion para comprar.",
      true
    );
    return;
  }

  // Feedback visual mientras se procesa la peticion.
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

    const payment = body?.payment as RedsysCheckoutPayment | undefined;

    if (
      !payment ||
      typeof payment.url !== "string" ||
      typeof payment.ds_SignatureVersion !== "string" ||
      typeof payment.ds_MerchantParameters !== "string" ||
      typeof payment.ds_Signature !== "string"
    ) {
      throw new Error("La pasarela no devolvio datos de redireccion validos.");
    }

    if (payment.orderId !== null && typeof payment.orderId === "number") {
      window.localStorage.setItem("lastPaymentOrderId", String(payment.orderId));
    }

    setCartMessage("Redirigiendo a la pasarela de pago...");
    submitRedsysForm(payment);
  } catch (error: any) {
    setCartMessage(error?.message ?? "Error al procesar la compra.", true);
  } finally {
    // Restablece boton siempre, haya exito o error.
    if (checkoutButton) checkoutButton.disabled = false;
    if (checkoutButton) checkoutButton.textContent = "Comprar";
  }
};

// Enlaza eventos de apertura/cierre/checkout/vaciado de carrito.
const initCartButton = () => {
  const buttons = document.querySelectorAll<HTMLButtonElement>("[data-cart-button]");
  const closeButton = document.querySelector<HTMLButtonElement>("[data-cart-close]");
  const emptyButton = document.querySelector<HTMLButtonElement>("[data-cart-empty]");
  const checkoutButton = document.querySelector<HTMLButtonElement>(
    "[data-cart-checkout]"
  );
  const backdrop = document.querySelector<HTMLElement>("[data-cart-backdrop]");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const panel = document.querySelector<HTMLElement>("[data-cart-panel]");
      const isOpen = panel ? !panel.classList.contains("translate-x-full") : false;
      if (isOpen) {
        closeCartPanel();
        return;
      }
      openCartPanel();
    });
  });

  closeButton?.addEventListener("click", closeCartPanel);
  backdrop?.addEventListener("click", closeCartPanel);
  checkoutButton?.addEventListener("click", handleCheckout);
  emptyButton?.addEventListener("click", () => {
    clearCartMessage();
    window.simpleCart?.empty?.();
  });
};

// Inicializa simpleCart y columnas personalizadas de render.
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
          // Escapa texto para renderizar HTML seguro dentro del carrito.
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
    // Sincroniza indicador al cargar y en cada cambio del carrito.
    updateCartIndicator(getCartQuantity());

    cart.bind("update", () => {
      updateCartIndicator(getCartQuantity());
    });

    void handlePaymentReturn();
  });
};

window.addEventListener("DOMContentLoaded", () => {
  // Orden importante: primero auth desde URL, luego render de UI dependiente.
  syncAuthFromUrl();
  handlePaymentQueryOnHome();
  updateAuthState();
  updateWishlistIndicator();
  initCartButton();
  initSimpleCart();

  if (typeof window.simpleCart !== "function") {
    void handlePaymentReturn();
  }
});

// Reacciona a cambios manuales de storage (login/logout/wishlist).
window.addEventListener("storage", () => {
  updateAuthState();
  updateWishlistIndicator();
});

// Eventos de dominio usados por otros scripts.
window.addEventListener("wishlist:updated", updateWishlistIndicator);
window.addEventListener("cart:open", openCartPanel);
