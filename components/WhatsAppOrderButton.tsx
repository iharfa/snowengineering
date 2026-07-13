"use client";

import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/CartProvider";
import { whatsappLink, type Customer } from "@/lib/order";
import type { CartItem } from "@/lib/types";

const WHATSAPP = process.env.NEXT_PUBLIC_SNOW_WHATSAPP_NUMBER || "9609690600";

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

  async function send() {
    if (!validate()) {
      alert("Please complete the required fields before sending by WhatsApp.");
      return;
    }
    const customer = getCustomer();

    // Open the window synchronously (inside the click gesture) so popup
    // blockers allow it; the URL is filled in after the order is logged.
    const win = window.open("", "_blank", "noopener");

    // Log the inquiry for sales tracking and grab its reference so the
    // WhatsApp message can be matched to the admin record. Waits briefly;
    // the message is sent with or without the reference.
    let ref: string | undefined;
    try {
      const res = await Promise.race([
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
        }).then((r) => (r.ok ? r.json() : null)),
        // generous timeout: serverless cold starts can take a few seconds,
        // and the reference is worth a short wait on the open blank tab
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
      ]);
      if (res?.orderId != null) ref = `WEB-${res.orderId}`;
    } catch {
      // logging is best effort; the WhatsApp message is the primary channel
    }

    const url = whatsappLink(WHATSAPP, customer, items, ref);
    if (win) {
      win.location.href = url;
    } else {
      window.location.href = url;
    }
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
