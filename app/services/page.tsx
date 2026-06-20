import type { Metadata } from "next";
import Link from "next/link";
import {
  ThermometerSnowflake,
  Snowflake,
  Droplets,
  Waves,
  Wrench,
  Package,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Services | Snow Engineering",
  description:
    "Refrigeration consultancy, ice plant design and installation, RSW systems, seawater cooling, troubleshooting, and spare parts sourcing in the Maldives.",
};

const services = [
  {
    icon: ThermometerSnowflake,
    title: "Refrigeration Consultancy",
    body: "Independent engineering advice across the full system lifecycle — feasibility, sizing, energy efficiency, and specification review.",
    points: ["System design & audits", "Load and capacity calculations", "Energy efficiency review", "Specification & tender support"],
  },
  {
    icon: Snowflake,
    title: "Ice Plant Design and Installation",
    body: "Block, flake, and tube ice plants sized to your catch volumes and site constraints, from design through commissioning.",
    points: ["Capacity sizing", "Plant selection & layout", "Installation & commissioning", "Operator handover"],
  },
  {
    icon: Droplets,
    title: "RSW Systems Design and Installation",
    body: "Refrigerated seawater systems for vessel hold chilling that protect catch quality and extend shelf life.",
    points: ["Hold chilling design", "Chiller & pump selection", "Onboard installation", "Performance tuning"],
  },
  {
    icon: Waves,
    title: "Seawater Cooling Systems",
    body: "Seawater cooling loops and heat rejection engineered for saline environments and continuous duty.",
    points: ["Cooling loop design", "Corrosion-aware material selection", "Heat exchanger sizing", "Pumping & controls"],
  },
  {
    icon: Wrench,
    title: "Troubleshooting",
    body: "Fault diagnosis and repair for refrigeration and cooling systems already in service, on island where needed.",
    points: ["Fault diagnosis", "Performance recovery", "Controls & electrical checks", "Preventive maintenance advice"],
  },
  {
    icon: Package,
    title: "Spare Parts Sourcing",
    body: "Reliable supply of compressors, controllers, valves, motors, and refrigeration components.",
    points: ["Component identification", "Sourcing & supply", "Compatible alternatives", "Stock for common spares"],
  },
];

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Services"
        title="Refrigeration and cooling engineering"
        subtitle="End-to-end engineering for ice plants, RSW, seawater cooling, and refrigeration — backed by troubleshooting and spare parts sourcing."
      />
      <section className="container-tech py-14">
        <div className="grid gap-6 md:grid-cols-2">
          {services.map((s) => (
            <div key={s.title} className="tech-card p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded bg-accent/30 text-primary">
                <s.icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <h2 className="mt-4 font-heading text-xl font-semibold text-charcoal">
                {s.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                {s.body}
              </p>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {s.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-charcoal">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center gap-4 rounded-lg border border-light-grey bg-white p-8 text-center">
          <h2 className="font-heading text-2xl font-bold text-charcoal">
            Have a cooling requirement?
          </h2>
          <p className="max-w-xl text-on-surface-variant">
            Tell us about your project and we will recommend the right engineering
            approach.
          </p>
          <Link href="/contact">
            <Button size="lg">Request Engineering Support</Button>
          </Link>
        </div>
      </section>
    </>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <section className="relative border-b border-light-grey bg-white">
      <div className="grid-bg absolute inset-0" aria-hidden />
      <div className="container-tech relative py-14">
        <span className="label-mono text-primary">{eyebrow}</span>
        <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight text-charcoal md:text-4xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl accent-line text-on-surface-variant">
          {subtitle}
        </p>
      </div>
    </section>
  );
}
