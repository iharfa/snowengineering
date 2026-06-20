import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Order Received | Snow Engineering",
  description: "Your order inquiry has been received.",
};

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ via?: string }>;
}) {
  const { via } = await searchParams;
  const viaWhatsApp = via === "whatsapp";

  return (
    <div className="container-tech flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <CheckCircle2 className="h-14 w-14 text-primary" />
      <h1 className="mt-6 font-heading text-3xl font-bold tracking-tight text-charcoal">
        Order inquiry received
      </h1>
      <p className="mt-4 max-w-lg text-on-surface-variant">
        {viaWhatsApp
          ? "Your WhatsApp message has been prepared — send it to complete your inquiry. "
          : "Thank you. We have received your order inquiry. "}
        Our team will confirm pricing, availability, and delivery, then issue a
        formal quotation.
      </p>
      <p className="label-mono mt-4 normal-case tracking-normal text-steel">
        This was an order inquiry, not a final tax invoice.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/shop">
          <Button variant="secondary">Continue browsing</Button>
        </Link>
        <Link href="/">
          <Button>Back to home</Button>
        </Link>
      </div>
    </div>
  );
}
