import { getWishlistItems } from "./wishlist-store";
import { initProductCards } from "./product-cards";

const escapeAttr = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

const buildCard = (product: any) => {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const [firstVariant] = variants;
  const preview =
    firstVariant?.files?.find((file: any) => file.type === "preview") ?? null;

  const variantsJson = escapeAttr(JSON.stringify(variants));
  const productName = escapeAttr(product.name ?? "");

  return `
    <article
      class="border border-gray-200 rounded bg-white flex flex-col relative"
      data-product-card
      data-product-id="${product.id ?? ""}"
      data-product-name="${productName}"
      data-variants="${variantsJson}"
    >
      <button
        type="button"
        aria-label="Añadir"
        class="appearance-none absolute top-0 right-0 mt-3 mr-3 text-gray-300 focus:text-gray-500 hover:text-red-500 transition focus:outline-none"
        data-wishlist-button
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          class="w-6 h-6 fill-current"
          data-wishlist-icon
        >
          <path fill="none" d="M0 0H24V24H0z" />
          <path d="M12.001 4.529c2.349-2.109 5.979-2.039 8.242.228 2.262 2.268 2.34 5.88.236 8.236l-8.48 8.492-8.478-8.492c-2.104-2.356-2.025-5.974.236-8.236 2.265-2.264 5.888-2.34 8.244-.228z" />
        </svg>
      </button>

      <div class="flex items-center justify-center flex-1 sm:flex-shrink-0 w-full p-6">
        ${
          preview?.preview_url
            ? `<img
              src="${preview.preview_url}"
              width="250"
              height="250"
              alt="${escapeAttr(`${firstVariant.name ?? ""} ${product.name ?? ""}`)}"
              title="${escapeAttr(`${firstVariant.name ?? ""} ${product.name ?? ""}`)}"
              loading="lazy"
              data-product-image
            />`
            : `<div class="w-[250px] h-[250px] bg-gray-100"></div>`
        }
      </div>

      <div class="flex-1 p-6 pt-0">
        <div class="text-center">
          <p class="mb-1 font-semibold text-gray-900">${productName}</p>
          <p class="text-sm text-gray-500" data-product-price></p>
        </div>
      </div>

      <div class="p-3 flex flex-col sm:flex-row justify-center items-center">
        ${
          variants.length > 1
            ? `<select
              class="form-select appearance-none w-full relative mb-3 sm:mb-0 flex-grow sm:mr-3 pl-3 py-2 bg-white border border-gray-300 focus:border-gray-500 shadow-sm text-gray-500 text-sm focus:outline-none focus:text-gray-900 rounded ring-0 focus:ring-0"
              data-variant-select
            >
              ${variants
                .map(
                  (variant: any) =>
                    `<option value="${variant.external_id}">${variant.color} - ${variant.size}</option>`
                )
                .join("")}
            </select>`
            : ""
        }

        <button
          class="w-full md:w-auto transition flex-shrink-0 py-2 px-4 border border-gray-300 hover:border-transparent shadow-sm text-sm font-medium bg-white text-gray-900 focus:text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:outline-none rounded"
          data-add-to-cart
          data-item-id="${firstVariant?.external_id ?? ""}"
          data-item-price="${firstVariant?.retail_price ?? ""}"
          data-item-url="/api/products/${firstVariant?.external_id ?? ""}"
          data-item-description="${escapeAttr(firstVariant?.name ?? "")}"
          data-item-image="${preview?.preview_url ?? ""}"
          data-item-name="${productName}"
          data-auth-required
          type="button"
        >
          Añadir
        </button>
      </div>
    </article>
  `;
};

const renderWishlist = () => {
  const grid = document.querySelector<HTMLElement>("#wishlist-grid");
  const empty = document.querySelector<HTMLElement>("#wishlist-empty");
  if (!grid || !empty) return;

  const items = getWishlistItems();
  grid.innerHTML = "";

  if (!items.length) {
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");
  grid.innerHTML = items.map(buildCard).join("");
  initProductCards(grid);
  window.dispatchEvent(new Event("storage"));
};

window.addEventListener("DOMContentLoaded", renderWishlist);
window.addEventListener("wishlist:updated", renderWishlist);
