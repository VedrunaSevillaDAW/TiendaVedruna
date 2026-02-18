import { isInWishlist, toggleWishlistItem } from "./wishlist-store";

// Formatea precio en moneda segun locale.
const formatPrice = (value: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(value);

// Lee variantes serializadas en data-variants de la tarjeta.
const parseVariants = (card: HTMLElement): any[] => {
  const raw = card.dataset.variants;
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

// Busca el archivo de preview de una variante.
const getPreviewFile = (variant: any) =>
  variant?.files?.find((file: any) => file.type === "preview");

// Pinta el estado visual del corazon en funcion de wishlist.
const updateWishlistIcon = (card: HTMLElement, productId: string) => {
  const icon = card.querySelector<SVGElement>("[data-wishlist-icon]");
  if (!icon) return;

  if (isInWishlist(productId)) {
    icon.classList.add("text-red-500");
  } else {
    icon.classList.remove("text-red-500");
  }
};

// Intenta anadir un item al carrito; devuelve exito/fallo.
const addItemToCart = (button: HTMLButtonElement) => {
  const id = button.dataset.itemId;
  const name = button.dataset.itemName;
  const url = button.dataset.itemUrl;
  const description = button.dataset.itemDescription;
  const image = button.dataset.itemImage;
  const price = Number(button.dataset.itemPrice);

  if (!id || !name || Number.isNaN(price)) return false;
  if (typeof window.simpleCart?.add !== "function") return false;

  window.simpleCart.add({
    id,
    name,
    price,
    // Cantidad inicial por click.
    quantity: 1,
    ...(url ? { url } : {}),
    ...(description ? { description } : {}),
    ...(image ? { image, thumb: image } : {}),
  });

  return true;
};

// Actualiza precio, imagen y datos de compra al cambiar variante.
const updateVariantUI = (card: HTMLElement, variant: any) => {
  const priceEl = card.querySelector<HTMLElement>("[data-product-price]");
  const imageEl = card.querySelector<HTMLImageElement>("[data-product-image]");
  const addButton = card.querySelector<HTMLButtonElement>("[data-add-to-cart]");
  const preview = getPreviewFile(variant);

  if (priceEl) {
    priceEl.textContent = formatPrice(variant.retail_price, variant.currency);
  }

  if (imageEl && preview?.preview_url) {
    imageEl.src = preview.preview_url;
    imageEl.alt = `${variant.name} ${card.dataset.productName ?? ""}`;
    imageEl.title = `${variant.name} ${card.dataset.productName ?? ""}`;
  }

  if (addButton) {
    addButton.dataset.itemId = variant.external_id;
    addButton.dataset.itemPrice = `${variant.retail_price}`;
    addButton.dataset.itemUrl = `/api/products/${variant.external_id}`;
    addButton.dataset.itemDescription = variant.name;
    addButton.dataset.itemImage = preview?.preview_url ?? "";
  }
};

// Inicializa comportamiento de tarjetas de producto en un contenedor dado.
export const initProductCards = (root: ParentNode = document) => {
  const cards = root.querySelectorAll<HTMLElement>("[data-product-card]");

  cards.forEach((card) => {
    const productId = card.dataset.productId ?? "";
    const productName = card.dataset.productName ?? "";
    const variants = parseVariants(card);
    const select = card.querySelector<HTMLSelectElement>(
      "[data-variant-select]"
    );

    updateWishlistIcon(card, productId);

    // Carga variante inicial por defecto.
    if (variants.length > 0) {
      updateVariantUI(card, variants[0]);
    }

    // Reacciona al selector de variantes.
    if (select && variants.length > 0) {
      select.addEventListener("change", () => {
        const chosen = variants.find(
          (variant: any) => `${variant.external_id}` === select.value
        );
        if (chosen) {
          updateVariantUI(card, chosen);
        }
      });
    }

    const wishlistButton = card.querySelector<HTMLButtonElement>(
      "[data-wishlist-button]"
    );
    const addToCartButton = card.querySelector<HTMLButtonElement>(
      "[data-add-to-cart]"
    );

    if (addToCartButton) {
      addToCartButton.addEventListener("click", (event) => {
        // Evita navegacion accidental si el boton esta dentro de enlaces.
        event.preventDefault();

        const added = addItemToCart(addToCartButton);
        if (!added) return;

        // Abre panel de carrito tras anadir.
        window.dispatchEvent(new Event("cart:open"));
      });
    }

    if (wishlistButton) {
      wishlistButton.addEventListener("click", () => {
        // Alterna producto en wishlist y refresca icono.
        toggleWishlistItem({ id: productId, name: productName, variants });
        updateWishlistIcon(card, productId);
      });
    }
  });
};
