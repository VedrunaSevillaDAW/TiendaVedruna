import type { APIRoute } from "astro";

type CheckoutItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

type CheckoutPayload = {
  items: CheckoutItem[];
  total: number;
  quantity: number;
  username?: string | null;
  createdAt?: string;
};

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
    const payload = (await request.json()) as CheckoutPayload;

    if (!payload || !Array.isArray(payload.items) || payload.items.length === 0) {
      return new Response(
        JSON.stringify({ message: "El carrito está vacío o no es válido." }),
        { status: 400 }
      );
    }

    const validItems = payload.items.filter(isValidItem);
    if (validItems.length !== payload.items.length) {
      return new Response(
        JSON.stringify({ message: "Hay productos no válidos en la compra." }),
        { status: 400 }
      );
    }

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
    return new Response(
      JSON.stringify({ message: "No se pudo procesar la compra." }),
      { status: 500 }
    );
  }
};
