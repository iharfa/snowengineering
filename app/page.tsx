import Link from "next/link";
import {
  Snowflake,
  ShieldCheck,
  Wrench,
  Package,
  Ship,
  ThermometerSnowflake,
  Droplets,
  Gauge,
  ArrowRight,
} from "lucide-react";
import { Hero } from "@/components/Hero";
import { ServiceCard } from "@/components/ServiceCard";
import { ProductCard } from "@/components/ProductCard";
import { ProjectCard } from "@/components/ProjectCard";
import { Button } from "@/components/ui/button";
import { getCatalog } from "@/lib/catalog";
import { sampleProjects } from "@/data/projects";

// Featured products come from the database-managed catalog.
export const dynamic = "force-dynamic";

const trust = [
  { icon: ShieldCheck, title: "10+ years in the field", text: "Refrigeration engineering across the Maldivian fisheries and resort sectors." },
  { icon: Ship, title: "Fisheries specialists", text: "Ice plants, RSW, and seawater cooling built for boats and island facilities." },
  { icon: Wrench, title: "On-island troubleshooting", text: "Fault diagnosis and repair for systems already in service." },
  { icon: Package, title: "Spare parts sourcing", text: "Reliable supply of refrigeration components and controllers." },
];

const servicePreview = [
  { icon: ThermometerSnowflake, title: "Refrigeration Consultancy", description: "System design, audits, and engineering advice for cooling infrastructure." },
  { icon: Snowflake, title: "Ice Plant Design & Installation", description: "Block, flake, and tube ice plants sized for fishing operations." },
  { icon: Droplets, title: "RSW & Seawater Cooling", description: "Refrigerated seawater and seawater cooling systems for vessels and shore." },
  { icon: Gauge, title: "Troubleshooting & Spares", description: "Diagnosis, repair, and sourcing of parts to keep systems running." },
];

export default async function HomePage() {
  const featured = (await getCatalog()).slice(0, 4);

  return (
    <>
      <Hero />

      {/* Trust strip */}
      <section className="border-b border-light-grey bg-white">
        <div className="container-tech grid gap-px bg-light-grey sm:grid-cols-2 lg:grid-cols-4">
          {trust.map((t) => (
            <div key={t.title} className="bg-white p-6">
              <t.icon className="h-6 w-6 text-primary" strokeWidth={2} />
              <h3 className="mt-3 font-heading text-base font-semibold text-charcoal">
                {t.title}
              </h3>
              <p className="mt-1 text-sm text-on-surface-variant">{t.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Services preview */}
      <section className="container-tech py-16">
        <SectionHeading
          eyebrow="What we do"
          title="Engineering services for cooling infrastructure"
          cta={{ href: "/services", label: "All services" }}
        />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {servicePreview.map((s) => (
            <ServiceCard key={s.title} {...s} />
          ))}
        </div>
      </section>

      {/* Built for the fisheries sector */}
      <section className="border-y border-light-grey bg-charcoal text-white">
        <div className="container-tech grid items-center gap-10 py-16 lg:grid-cols-2">
          <div>
            <span className="label-mono text-accent">Built for the fisheries sector</span>
            <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight">
              Cooling that holds up at sea and on the island
            </h2>
            <p className="mt-4 accent-line border-accent text-light-grey">
              From ice plants and refrigerated seawater (RSW) to seawater cooling
              and cold storage, we engineer systems for the realities of Maldivian
              fishing — saline environments, remote sites, and continuous duty.
            </p>
            <Link href="/services" className="mt-6 inline-block">
              <Button variant="secondary">Explore fisheries services</Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10">
            {[
              { icon: Snowflake, title: "Ice Plants", text: "Capacity sizing for catch volumes" },
              { icon: Ship, title: "RSW Systems", text: "Vessel hold chilling" },
              { icon: Droplets, title: "Seawater Cooling", text: "Loops and heat rejection" },
              { icon: ThermometerSnowflake, title: "Cold Storage", text: "Cold rooms and blast freezing" },
            ].map((t) => (
              <div key={t.title} className="grid-bg flex flex-col gap-2 bg-charcoal p-6">
                <t.icon className="h-6 w-6 text-accent" strokeWidth={2} />
                <div className="font-heading font-semibold text-white">{t.title}</div>
                <p className="text-sm text-light-grey">{t.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shop preview */}
      <section className="container-tech py-16">
        <SectionHeading
          eyebrow="Catalog"
          title="Industrial cooling components"
          cta={{ href: "/shop", label: "Browse shop" }}
        />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Project preview */}
      <section className="border-t border-light-grey bg-white">
        <div className="container-tech py-16">
          <SectionHeading
            eyebrow="Selected work"
            title="Projects across the Maldives"
            cta={{ href: "/projects", label: "All projects" }}
          />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sampleProjects.slice(0, 3).map((p) => (
              <ProjectCard key={p.title} project={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="bg-primary">
        <div className="container-tech flex flex-col items-start gap-6 py-14 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-heading text-2xl font-bold text-white md:text-3xl">
              Need engineering support or a quote?
            </h2>
            <p className="mt-2 max-w-xl text-white/85">
              Tell us about your cooling requirement and our team will respond
              with the right approach.
            </p>
          </div>
          <Link href="/contact">
            <Button variant="secondary" size="lg">
              Request a Quote <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}

function SectionHeading({
  eyebrow,
  title,
  cta,
}: {
  eyebrow: string;
  title: string;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <span className="label-mono text-primary">{eyebrow}</span>
        <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight text-charcoal md:text-3xl">
          {title}
        </h2>
      </div>
      {cta && (
        <Link
          href={cta.href}
          className="hidden whitespace-nowrap text-sm font-medium text-primary hover:underline sm:inline-flex sm:items-center sm:gap-1"
        >
          {cta.label} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
