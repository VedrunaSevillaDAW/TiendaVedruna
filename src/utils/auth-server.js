// URL por defecto del servidor de autenticacion externo.
const DEFAULT_AUTH_SERVER_URL = "http://localhost:9000";

export const getAuthServerUrl = () => {
  // Prioriza LOGIN_BASE_URL; mantiene compatibilidad con PUBLIC_LOGIN_VEDRUNA_URL.
  const rawUrl =
    import.meta.env.LOGIN_BASE_URL || import.meta.env.PUBLIC_LOGIN_VEDRUNA_URL;
  // Normaliza valor y aplica fallback local si no hay variable.
  const baseUrl = (rawUrl && String(rawUrl).trim()) || DEFAULT_AUTH_SERVER_URL;
  // Elimina barra final para componer rutas de forma segura.
  return baseUrl.replace(/\/+$/, "");
};
