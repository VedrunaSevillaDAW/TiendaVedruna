import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params }) => {
  const id = String(params.id ?? "").trim();

  if (!/^\d+$/.test(id)) {
    return new Response(JSON.stringify({ message: "ID de orden invalido." }), {
      status: 400,
    });
  }

  try {
    const paymentApiBaseUrl =
      import.meta.env.PAYMENT_API_BASE_URL ?? "http://localhost:4242";

    const response = await fetch(`${paymentApiBaseUrl}/api/orders/${id}`);
    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      return new Response(
        JSON.stringify({ message: body?.message ?? "No se pudo consultar la orden." }),
        { status: 502 }
      );
    }

    return new Response(JSON.stringify(body), { status: 200 });
  } catch {
    return new Response(
      JSON.stringify({ message: "Error al consultar el estado de pago." }),
      { status: 500 }
    );
  }
};
