export const formatVariantName = (variantName: string): string => {
  // El nombre viene con formato "Producto - Variante"; nos quedamos con la parte de variante.
  const [, name] = variantName.split(" - ");

  // Si no hay parte de variante, devuelve un texto de respaldo.
  return name ? name : "One style";
};
