"use client";

import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/CartProvider";
import { whatsappLink, type Customer } from "@/lib/order";
import type { CartItem } from "@/lib/types";

const WHATSAPP = process.env.NEXT_PUBLIC_SNOW_WHATSAPP_NUMBER || "9607777777";

export function WhatsAppOrderButton({
  items,
  getCustomer,
  validate,
  disabled,
}: {
  items: CartItem[];
  getCustomer: () => Customer;
  validate: () => boolean;
  disabled?: boolean;
}) {
  const router = useRouter();
  const { clear } = useCart();

  function send() {
    if (!validate()) {
      alert("Please complete the required fields before sending by WhatsApp.");
      return;
    }
    const url = whatsappLink(WHATSAPP, getCustomer(), items);
    window.open(url, "_blank", "noopener");
    clear();
    router.push("/thank-you?via=whatsapp");
  }

  return (
    <Button
      type="button"
      variant="secondary"
      className="flex-1"
      onClick={send}
      disabled={disabled}
    >
      <MessageCircle className="h-4 w-4" />
      Send Order by WhatsApp
    </Button>
  );
}
