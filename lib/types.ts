// Categories are free-form now that products are managed from the admin;
// these are the defaults used by the seed catalog.
export type ProductCategory = string;

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  shortDescription: string;
  longDescription: string;
  image: string;
  specifications: { label: string; value: string }[];
  stockStatus: "In Stock" | "Made to Order" | "On Request";
  price: number;
  currency: string;
  gstRate: number;
  isPriceHidden: boolean;
  erpnextItemCode: string;
}

export interface CartItem {
  id: string;
  slug: string;
  name: string;
  erpnextItemCode: string;
  quantity: number;
  // price stays unknown until revealed; null = not revealed
  price: number | null;
  currency: string;
  gstRate: number;
}
