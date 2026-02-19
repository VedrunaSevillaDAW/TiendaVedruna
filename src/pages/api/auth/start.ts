import type { APIRoute } from "astro";

// Devuelve URL base del servidor de auth sin barra final.
const getBaseUrl = () => {
  const raw = import.meta.env.LOGIN_BASE_URL || "http://localhost:9000";
  return raw.replace(/\/+$/, "");
};

export const GET: APIRoute = async ({ cookies, redirect }) => {
  // Credenciales del cliente OAuth registradas en el auth server.
  const clientId = import.meta.env.LOGIN_CLIENT_ID;
  const redirectUri = import.meta.env.LOGIN_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    // Error de configuracion del entorno.
    return new Response("Missing LOGIN_CLIENT_ID or LOGIN_REDIRECT_URI", {
      status: 500,
    });
  }

  // Estado anti-CSRF para validar vuelta del callback.
  const state = crypto.randomUUID();
  cookies.set("oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  // Construye URL de autorizacion OAuth2.
  const authorizeUrl = new URL(`${getBaseUrl()}/oauth2/authorize`);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", "openid profile email api");
  authorizeUrl.searchParams.set("state", state);

  // Redirige al servidor de login externo.
  return redirect(authorizeUrl.toString(), 302);
};
