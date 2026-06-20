import type { Metadata } from "next";
import Link from "next/link";
import {
  ThermometerSnowflake,
  Snowflake,
  Droplets,
  Waves,
  Wrench,
  Package,
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
    code: "REF-CON-01",
    body: "Technical analysis and engineering advice across the full system lifecycle — feasibility, sizing, energy efficiency, and specification review.",
    listLabel: "Target Customers",
    points: ["Resort Facility Managers", "Commercial Cold Storage Owners"],
    cta: "Book Consultation",
  },
  {
    icon: Snowflake,
    title: "Ice Plant Design & Installation",
    code: "ICE-PLT-04",
    body: "Block, flake, and tube ice plants sized to your catch volumes and site constraints, from design through commissioning.",
    listLabel: "Use Cases",
    points: ["Regional Fishery Hubs", "Island Community Cooperatives"],
    cta: "Request Blueprint",
  },
  {
    icon: Droplets,
    title: "RSW Systems",
    code: "RSW-MAR-09",
    body: "Refrigerated Sea Water (RSW) systems for vessel hold chilling that protect catch quality and extend shelf life.",
    listLabel: "Target Customers",
    points: ["Commercial Trawlers", "Long-line Fishing Fleets"],
    cta: "Vessel Audit",
  },
  {
    icon: Waves,
    title: "Seawater Cooling Systems",
    code: "SWC-SYS-12",
    body: "Corrosion-resistant cooling solutions using titanium heat exchangers, engineered for maximum longevity in marine environments.",
    listLabel: "Use Cases",
    points: ["Overwater Villa HVAC", "Industrial Desalination Plants"],
    cta: "Request Design",
  },
  {
    icon: Wrench,
    title: "Troubleshooting",
    code: "ERR-DIAG-00",
    body: "24/7 technical support and rapid fault diagnosis. We identify refrigerant leaks, electrical failures, and mechanical bottlenecking.",
    listLabel: "Service Type",
    points: ["On-site Emergency Repair", "Remote Performance Monitoring"],
    cta: "Emergency Call",
    danger: true,
  },
  {
    icon: Package,
    title: "Spare Parts Sourcing",
    code: "PRT-LOG-55",
    body: "Direct access to OEM compressors, condensers, and controls. Optimized logistics for rapid delivery within the Maldives.",
    listLabel: "Inventory",
    points: ["Bitzer / Sabroe / Bock Parts", "Custom Marine-grade Valves"],
    cta: "Source Parts",
  },
];

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Services"
        title="Industrial Cooling & Precision Engineering"
        subtitle="End-to-end engineering for ice plants, RSW, seawater cooling, and refrigeration — backed by troubleshooting and spare parts sourcing."
      />
      <section className="container-tech py-14">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <div key={s.title} className="tech-card flex flex-col overflow-hidden">
              <div className="flex flex-1 flex-col p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded bg-accent/30 text-primary">
                  <s.icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <h2 className="mt-4 font-heading text-xl font-semibold text-charcoal">
                  {s.title}
                </h2>
                <div className="label-mono mt-1 normal-case tracking-wide text-primary">
                  CODE: {s.code}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
                  {s.body}
                </p>
                <div className="mt-auto pt-5">
                  <div className="rounded border border-light-grey bg-[#eef1f3] p-3">
                    <div className="label-mono text-steel">{s.listLabel}</div>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-charcoal marker:text-primary">
                      {s.points.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              <Link href="/contact" className="block">
                <Button
                  variant={s.danger ? "danger" : "primary"}
                  className="w-full rounded-none font-mono text-xs uppercase tracking-[0.1em]"
                >
                  {s.cta}
                </Button>
              </Link>
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
