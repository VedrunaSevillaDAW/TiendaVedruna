import type { APIRoute } from "astro";
import { printful } from "../../../lib/printful-client";

export const GET: APIRoute = async ({ params }) => {
  // ID de variante recibido por parametro dinamico de ruta.
  const id = params.id;

  if (!id) {
    return new Response(
      JSON.stringify({ errors: [{ key: "missing_id", message: "Missing id." }] }),
      { status: 400 }
    );
  }

  try {
    // Solicita detalle de variante a Printful.
    const { result } = await printful.get(`store/variants/@${id}`);
    const body = {
      id,
      // Precio minorista actual en Printful.
      price: result.retail_price,
      // Endpoint local asociado a esta variante.
      url: `/api/products/${id}`,
    };

    // Cache de borde para reducir llamadas repetidas.
    const headers = new Headers();
    headers.set("Cache-Control", "s-maxage=3600, stale-while-revalidate");

    return new Response(JSON.stringify(body), { status: 200, headers });
  } catch (error: any) {
    // Si falla la busqueda en Printful, responde 404 con detalle.
    return new Response(
      JSON.stringify({
        errors: [
          {
            key: error?.message,
            message: error?.message,
          },
        ],
      }),
      { status: 404 }
    );
  }
};
