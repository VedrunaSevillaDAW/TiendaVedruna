import type { APIRoute } from "astro";

type CheckoutItem = {
  // ID de variante/producto.
  id: string;
  // Nombre mostrado al usuario.
  name: string;
  // Precio unitario.
  price: number;
  // Cantidad comprada.
  quantity: number;
  // URL opcional de imagen.
  image?: string;
};

type CheckoutPayload = {
  // Lineas de compra.
  items: CheckoutItem[];
  // Total calculado por frontend.
  total: number;
  // Cantidad total de articulos.
  quantity: number;
  // Usuario opcional asociado a la compra.
  username?: string | null;
  // Marca temporal de creacion.
  createdAt?: string;
};

// Validacion basica de cada item del carrito.
const isValidItem = (item: CheckoutItem) =>
  Boolean(
    item &&
      typeof item.id === "string" &&
      typeof item.name === "string" &&
      typeof item.price === "number" &&
      item.price > 0 &&
      typeof item.quantity === "number" &&
      item.quantity > 0
  );

export const POST: APIRoute = async ({ request }) => {
  try {
    // Lee y tipa payload JSON del checkout.
    const payload = (await request.json()) as CheckoutPayload;

    if (!payload || !Array.isArray(payload.items) || payload.items.length === 0) {
      return new Response(
        JSON.stringify({ message: "El carrito esta vacio o no es valido." }),
        { status: 400 }
      );
    }

    // Verifica que todos los items cumplan estructura y reglas minimas.
    const validItems = payload.items.filter(isValidItem);
    if (validItems.length !== payload.items.length) {
      return new Response(
        JSON.stringify({ message: "Hay productos no validos en la compra." }),
        { status: 400 }
      );
    }

    // Recalcula total para detectar manipulaciones en cliente.
    const totalFromItems = validItems.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );

    if (Math.abs(totalFromItems - Number(payload.total ?? 0)) > 0.01) {
      return new Response(
        JSON.stringify({ message: "El total de la compra no coincide." }),
        { status: 400 }
      );
    }

    // Respuesta mock de compra aceptada.
    return new Response(
      JSON.stringify({
        message: "Compra recibida correctamente.",
        order: {
          id: `ord_${Date.now()}`,
          username: payload.username ?? null,
          items: validItems,
          quantity: payload.quantity ?? 0,
          total: totalFromItems,
          createdAt: payload.createdAt ?? new Date().toISOString(),
        },
      }),
      { status: 200 }
    );
  } catch {
    // Error inesperado de parseo o ejecucion.
    return new Response(
      JSON.stringify({ message: "No se pudo procesar la compra." }),
      { status: 500 }
    );
  }
};
