import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../utils/Firebase";

const provider = new GoogleAuthProvider();

const setUsername = (value: string | null) => {
  if (value) {
    window.localStorage.setItem("username", value);
  } else {
    window.localStorage.removeItem("username");
  }
  window.dispatchEvent(new Event("storage"));
};

const showError = (message: string) => {
  const errorEl = document.querySelector<HTMLElement>("#login-error");
  if (!errorEl) return;
  errorEl.textContent = message;
  errorEl.classList.remove("hidden");
};

const clearError = () => {
  const errorEl = document.querySelector<HTMLElement>("#login-error");
  if (!errorEl) return;
  errorEl.textContent = "";
  errorEl.classList.add("hidden");
};

const updateView = () => {
  const username = window.localStorage.getItem("username");
  const loggedIn = Boolean(username);

  const loggedInEl = document.querySelector<HTMLElement>("#login-logged-in");
  const loggedOutEl = document.querySelector<HTMLElement>("#login-logged-out");
  const nameEl = document.querySelector<HTMLElement>("#login-username");

  if (loggedInEl) loggedInEl.classList.toggle("hidden", !loggedIn);
  if (loggedOutEl) loggedOutEl.classList.toggle("hidden", loggedIn);
  if (nameEl) nameEl.textContent = username ?? "";
};

window.addEventListener("DOMContentLoaded", () => {
  updateView();

  const form = document.querySelector<HTMLFormElement>("#login-form");
  const googleButton = document.querySelector<HTMLButtonElement>(
    "#login-google"
  );
  const logoutButton = document.querySelector<HTMLButtonElement>(
    "#login-logout"
  );

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearError();

    const email = (
      document.querySelector<HTMLInputElement>("#login-email")?.value ?? ""
    ).trim();
    const password = (
      document.querySelector<HTMLInputElement>("#login-password")?.value ?? ""
    ).trim();

    if (!email || !password) {
      showError("Please fill in all fields.");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      setUsername(user.email || "User");
      updateView();
    } catch {
      showError("Invalid email or password.");
    }
  });

  googleButton?.addEventListener("click", async () => {
    clearError();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      setUsername(user.displayName || "User");
      updateView();
    } catch {
      showError("Failed to sign in with Google.");
    }
  });

  logoutButton?.addEventListener("click", () => {
    setUsername(null);
    updateView();
  });
});

window.addEventListener("storage", updateView);
