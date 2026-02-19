import { PrintfulClient } from "printful-request";

// Token de acceso a Printful cargado desde entorno.
const apiKey = import.meta.env.PRINTFUL_API_KEY;

// Cliente reusable para todas las llamadas a la API de Printful.
export const printful = new PrintfulClient(apiKey);
