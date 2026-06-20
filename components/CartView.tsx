"use client";

import Link from "next/link";
import { Trash2, Truck } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { CartSummary } from "@/components/CartSummary";
import { GSTSummary } from "@/components/GSTSummary";
import { CheckoutForm } from "@/components/CheckoutForm";
import { Button } from "@/components/ui/button";
import { cartTotals } from "@/lib/cart";

export function CartView() {
  const { items, clear } = useCart();
  const totals = cartTotals(items);
  const hasItems = items.length > 0;

  return (
    <div className="container-tech py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-charcoal">
          Cart &amp; Checkout
        </h1>
        {hasItems && (
          <button
            onClick={clear}
            className="flex items-center gap-1.5 text-sm text-steel hover:text-primary"
          >
            <Trash2 className="h-4 w-4" /> Clear cart
          </button>
        )}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <CartSummary />

          {hasItems && (
            <div className="tech-card p-6">
              <h2 className="font-heading text-xl font-semibold text-charcoal">
                Your details
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Submit your order inquiry by email or WhatsApp. Our team will
                confirm pricing, availability, and delivery.
              </p>
              <div className="mt-5">
                <CheckoutForm />
              </div>
            </div>
          )}
        </div>

        <aside className="lg:col-span-1">
          <div className="tech-card sticky top-20 p-6">
            <h2 className="font-heading text-lg font-semibold text-charcoal">
              Order estimate
            </h2>
            <div className="mt-4">
              <GSTSummary
                subtotal={totals.subtotal}
                gstAmount={totals.gstAmount}
                total={totals.total}
                pendingReveal={totals.pendingReveal}
              />
            </div>
            <div className="mt-5 flex items-start gap-2 rounded border border-light-grey bg-background p-3 text-xs text-on-surface-variant">
              <Truck className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
              <span>
                Delivery and handling charges may apply depending on item size and
                destination.
              </span>
            </div>
            {!hasItems && (
              <Link href="/shop" className="mt-4 block">
                <Button variant="secondary" className="w-full">
                  Browse Products
                </Button>
              </Link>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
