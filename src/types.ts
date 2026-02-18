declare global {
  interface Window {
    // simpleCart se inyecta por script global en el navegador.
    simpleCart?: any;
  }
}

export interface PrintfulProduct {
  // Identificador de producto en Printful.
  id: string;
  // Nombre visible del producto.
  name: string;
}

// Convierte este archivo en modulo para evitar colisiones globales.
export {};
