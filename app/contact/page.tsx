import type { Metadata } from "next";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import { PageHeader } from "@/app/services/page";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact | Snow Engineering",
  description:
    "Contact Snow Engineering for refrigeration consultancy, ice plant and RSW systems, troubleshooting, and spare parts sourcing in the Maldives.",
};

const wa = process.env.NEXT_PUBLIC_SNOW_WHATSAPP_NUMBER || "9609690600";
const email = "sales@snowengineering.mv";

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Request engineering support or a quote"
        subtitle="Tell us about your refrigeration, cooling, or spare parts requirement and our team will respond."
      />
      <section className="container-tech grid gap-10 py-14 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-1">
          <ContactItem icon={MapPin} label="Office" value="Malé City, Maldives" />
          <ContactItem icon={Mail} label="Email" value={email} href={`mailto:${email}`} />
          <ContactItem
            icon={MessageCircle}
            label="WhatsApp"
            value={`+${wa.replace(/\D/g, "")}`}
            href={`https://wa.me/${wa.replace(/\D/g, "")}`}
          />
          <ContactItem icon={Phone} label="Phone" value={`+${wa.replace(/\D/g, "")}`} />
          <p className="label-mono normal-case tracking-normal text-steel">
            Prices and availability quoted are subject to confirmation. Final
            quotations and tax invoices are issued from our office.
          </p>
        </div>
        <div className="lg:col-span-2">
          <ContactForm />
        </div>
      </section>
    </>
  );
}

function ContactItem({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded bg-accent/30 text-primary">
        <Icon className="h-5 w-5" strokeWidth={2} />
      </div>
      <div>
        <div className="label-mono">{label}</div>
        <div className="mt-0.5 text-sm text-charcoal">{value}</div>
      </div>
    </div>
  );
  return href ? (
    <a href={href} className="block hover:opacity-80">
      {inner}
    </a>
  ) : (
    inner
  );
}
