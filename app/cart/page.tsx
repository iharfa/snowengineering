import type { Metadata } from "next";
import { CartView } from "@/components/CartView";

export const metadata: Metadata = {
  title: "Cart & Checkout | Snow Engineering",
  description:
    "Review your selected products and submit an order inquiry by email or WhatsApp. Prices and availability are subject to confirmation.",
};

export default function CartPage() {
  return <CartView />;
}
