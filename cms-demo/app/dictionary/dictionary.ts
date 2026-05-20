export const productNameMap: Record<string, string> = {
  "produkt-a-standard": "Produkt A — Standard",
  "produkt-a-premium": "Produkt A — Premium",
  "produkt-b-podstawowy": "Produkt B — Podstawowy",
  "produkt-c-mini": "Produkt C — Mini",
  "produkt-c-max": "Produkt C — Max",
  "produkt-d-ekspres": "Produkt D — Express",
  "produkt-e-ramka": "Produkt E — Ramka",
};

export const getProductDisplayName = (productKey: string) => {
  return productNameMap[productKey] || productKey;
};
