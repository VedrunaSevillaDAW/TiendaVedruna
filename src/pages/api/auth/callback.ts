import type { APIRoute } from "astro";

type TokenResponse = {
  // Token de acceso devuelto por /oauth2/token.
  access_token?: string;
};

type MeResponse = {
  // Usuario principal en payload de /api/v1/user/me.
  username?: string;
  email?: string;
};

// Devuelve URL base del servidor de auth sin barra final.
const getBaseUrl = () => {
  const raw = import.meta.env.LOGIN_BASE_URL || "http://localhost:9000";
  return raw.replace(/\/+$/, "");
};

// Convierte client_id:client_secret a cabecera Basic.
const toBasicAuth = (clientId: string, clientSecret: string) =>
  `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  // Parametros de vuelta desde authorization endpoint.
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = cookies.get("oauth_state")?.value;

  const clientId = import.meta.env.LOGIN_CLIENT_ID;
  const clientSecret = import.meta.env.LOGIN_CLIENT_SECRET;
  const redirectUri = import.meta.env.LOGIN_REDIRECT_URI;

  // El estado se consume una sola vez.
  cookies.delete("oauth_state", { path: "/" });

  // Valida integridad del callback.
  if (!code || !state || !expectedState || state !== expectedState) {
    return redirect("/?auth_error=state", 302);
  }

  if (!clientId || !clientSecret || !redirectUri) {
    // Entorno incompleto para cerrar flujo OAuth.
    return redirect("/?auth_error=config", 302);
  }

  try {
    // Intercambia code por access token.
    const tokenResponse = await fetch(`${getBaseUrl()}/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: toBasicAuth(clientId, clientSecret),
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      return redirect("/?auth_error=token", 302);
    }

    const tokenBody = (await tokenResponse.json()) as TokenResponse;
    const accessToken = tokenBody.access_token;
    if (!accessToken) {
      return redirect("/?auth_error=token", 302);
    }

    // Consulta datos del usuario autenticado.
    const meResponse = await fetch(`${getBaseUrl()}/api/v1/user/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!meResponse.ok) {
      return redirect("/?auth_error=user", 302);
    }

    const me = (await meResponse.json()) as MeResponse;
    const user = me.username || me.email;
    if (!user) {
      return redirect("/?auth_error=user", 302);
    }

    // Devuelve a home con usuario en query para sincronizar estado local.
    return redirect(`/?auth_user=${encodeURIComponent(user)}`, 302);
  } catch {
    // Fallo de red o excepcion no controlada.
    return redirect("/?auth_error=network", 302);
  }
};
