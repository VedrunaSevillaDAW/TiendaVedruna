import { PrintfulClient } from "printful-request";

const apiKey = import.meta.env.PRINTFUL_API_KEY;

export const printful = new PrintfulClient(apiKey);
