import type { APIRoute } from "astro";
import { printful } from "../../../lib/printful-client";

export const GET: APIRoute = async ({ params }) => {
  const id = params.id;

  if (!id) {
    return new Response(
      JSON.stringify({ errors: [{ key: "missing_id", message: "Missing id." }] }),
      { status: 400 }
    );
  }

  try {
    const { result } = await printful.get(`store/variants/@${id}`);
    const body = {
      id,
      price: result.retail_price,
      url: `/api/products/${id}`,
    };

    const headers = new Headers();
    headers.set("Cache-Control", "s-maxage=3600, stale-while-revalidate");

    return new Response(JSON.stringify(body), { status: 200, headers });
  } catch (error: any) {
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
