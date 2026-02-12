import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth } from "../utils/Firebase";

const showMessage = (id: string, message: string) => {
  const el = document.querySelector<HTMLElement>(id);
  if (!el) return;
  el.textContent = message;
  el.classList.remove("hidden");
};

const hideMessage = (id: string) => {
  const el = document.querySelector<HTMLElement>(id);
  if (!el) return;
  el.textContent = "";
  el.classList.add("hidden");
};

window.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector<HTMLFormElement>("#register-form");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    hideMessage("#register-error");
    hideMessage("#register-success");

    const name = (
      document.querySelector<HTMLInputElement>("#register-name")?.value ?? ""
    ).trim();
    const surname = (
      document.querySelector<HTMLInputElement>("#register-surname")?.value ?? ""
    ).trim();
    const email = (
      document.querySelector<HTMLInputElement>("#register-email")?.value ?? ""
    ).trim();
    const password = (
      document.querySelector<HTMLInputElement>("#register-password")?.value ?? ""
    ).trim();

    if (!email || !password || !name || !surname) {
      showMessage("#register-error", "Please fill in all fields.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      await sendEmailVerification(user);

      showMessage(
        "#register-success",
        "Account created successfully! We've sent you a verification email. Please check your inbox. Redirecting to login..."
      );

      setTimeout(() => {
        window.location.href = "/login";
      }, 4000);
    } catch (err: any) {
      showMessage("#register-error", `Error creating account: ${err.message}`);
    }
  });
});
