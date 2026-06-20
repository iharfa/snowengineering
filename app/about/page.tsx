import type { Metadata } from "next";
import Link from "next/link";
import { Target, Compass, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/app/services/page";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About | Snow Engineering",
  description:
    "Snow Engineering is a Maldives-based refrigeration and engineering consultancy specializing in fisheries-sector cooling systems.",
};

const values = [
  { icon: Target, title: "Engineering-first", text: "We lead with calculations and field reality, not sales catalogs." },
  { icon: Compass, title: "Built for the Maldives", text: "Designs account for saline environments, remote islands, and continuous duty." },
  { icon: ShieldCheck, title: "Reliable supply", text: "We source the right components and stand behind the systems we deliver." },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About"
        title="Refrigeration engineering, built for the Maldives"
        subtitle="A Maldives-based refrigeration and engineering consultancy specializing in fisheries-sector cooling systems."
      />
      <section className="container-tech grid gap-10 py-14 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4 text-on-surface-variant">
          <p className="accent-line text-lg text-charcoal">
            Snow Engineering specializes in fisheries-sector cooling — ice plant
            design and installation, RSW systems, seawater cooling, refrigeration
            troubleshooting, and spare parts sourcing.
          </p>
          <p>
            Alongside our consultancy work, we maintain a focused retail catalog
            for VRFs, small water plants, spare parts, and controllers — so
            operators can source dependable components without long lead times.
          </p>
          <p>
            We work across fisheries, cold chain, resorts, and institutions,
            engineering systems that perform in the conditions they actually
            operate in. From feasibility and sizing through installation,
            commissioning, and ongoing support, our focus is reliable cooling
            that holds up over time.
          </p>
        </div>
        <div className="space-y-4">
          {values.map((v) => (
            <div key={v.title} className="tech-card p-5">
              <v.icon className="h-6 w-6 text-primary" strokeWidth={2} />
              <h3 className="mt-3 font-heading font-semibold text-charcoal">
                {v.title}
              </h3>
              <p className="mt-1 text-sm text-on-surface-variant">{v.text}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="border-t border-light-grey bg-white">
        <div className="container-tech flex flex-col items-center gap-4 py-12 text-center">
          <h2 className="font-heading text-2xl font-bold text-charcoal">
            Work with our engineering team
          </h2>
          <Link href="/contact">
            <Button size="lg">Get in touch</Button>
          </Link>
        </div>
      </section>
    </>
  );
}
