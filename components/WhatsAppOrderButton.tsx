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
  turnstileToken,
}: {
  items: CartItem[];
  getCustomer: () => Customer;
  validate: () => boolean;
  disabled?: boolean;
  turnstileToken?: string;
}) {
  const router = useRouter();
  const { clear } = useCart();

  function send() {
    if (!validate()) {
      alert("Please complete the required fields before sending by WhatsApp.");
      return;
    }
    const customer = getCustomer();

    // Log the inquiry for sales tracking (best effort — the WhatsApp message
    // itself is the customer-facing channel, so never block on this).
    fetch("/api/orders/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer,
        items,
        turnstileToken,
        via: "whatsapp",
      }),
      keepalive: true,
    }).catch(() => {});

    const url = whatsappLink(WHATSAPP, customer, items);
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
