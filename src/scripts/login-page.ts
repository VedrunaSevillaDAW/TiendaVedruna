import { getAuthServerUrl } from "../utils/auth-server";

// Muestra mensajes de error en el bloque visual de login.
const showError = (message: string) => {
  const errorEl = document.querySelector<HTMLElement>("#login-error");
  if (!errorEl) return;
  errorEl.textContent = message;
  errorEl.classList.remove("hidden");
};

// Alterna entre vista "logueado" y "no logueado" en la pagina de login.
const updateLoginView = () => {
  const username = window.localStorage.getItem("username");
  const loggedIn = Boolean(username);

  const loggedInEl = document.querySelector<HTMLElement>("#login-logged-in");
  const loggedOutEl = document.querySelector<HTMLElement>("#login-logged-out");
  const usernameEl = document.querySelector<HTMLElement>("#login-username");

  if (loggedInEl) loggedInEl.classList.toggle("hidden", !loggedIn);
  if (loggedOutEl) loggedOutEl.classList.toggle("hidden", loggedIn);
  if (usernameEl) usernameEl.textContent = username ?? "";
};

window.addEventListener("DOMContentLoaded", () => {
  // Sincroniza estado inicial al cargar la pagina.
  updateLoginView();

  const form = document.querySelector<HTMLFormElement>("#login-form");
  const logoutButton = document.querySelector<HTMLButtonElement>("#login-logout");

  form?.addEventListener("submit", (event) => {
    // Evita submit HTML clasico; el flujo real empieza en /api/auth/start.
    event.preventDefault();
    try {
      // Evita posibles redirecciones cacheadas del navegador/proxy.
      const startUrl = `/api/auth/start?ts=${Date.now()}`;
      window.location.replace(startUrl);
    } catch {
      showError("No se pudo iniciar el login.");
    }
  });

  logoutButton?.addEventListener("click", () => {
    // Limpia sesion local visible en la UI.
    window.localStorage.removeItem("username");
    window.dispatchEvent(new Event("storage"));
    // Intenta cerrar sesion tambien en el servidor de autenticacion externo.
    const logoutUrl = `${getAuthServerUrl().replace(/\/+$/, "")}/logout`;
    fetch(logoutUrl, {
      method: "GET",
      mode: "no-cors",
      credentials: "include",
    }).catch(() => {
      // Ignora errores de red/CORS: el logout local ya se aplico.
    });
  });
});

// Reacciona a cambios de almacenamiento para refrescar la vista.
window.addEventListener("storage", updateLoginView);
