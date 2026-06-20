import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-light-grey bg-white">
      <div className="grid-bg absolute inset-0" aria-hidden />
      <div className="container-tech relative grid items-center gap-10 py-14 md:py-20 lg:grid-cols-2 lg:gap-16">
        <div>
          <span className="label-mono text-primary">
            Refrigeration &amp; Cooling Engineering · Maldives
          </span>
          <h1 className="mt-4 font-heading text-3xl font-bold leading-tight tracking-tight text-charcoal md:text-5xl">
            Refrigeration Engineering for Fisheries, Cold Chain, and Industrial
            Cooling
          </h1>
          <p className="mt-5 accent-line text-base text-on-surface-variant md:text-lg">
            Design, installation, troubleshooting, and spare parts sourcing for
            ice plants, RSW systems, VRFs, and cooling infrastructure in the
            Maldives.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/contact">
              <Button size="lg">Request Engineering Support</Button>
            </Link>
            <Link href="/shop">
              <Button size="lg" variant="secondary">
                Browse Products
              </Button>
            </Link>
          </div>
        </div>

        <div className="relative">
          <Image
            src="/snow-mark.svg"
            alt=""
            aria-hidden
            width={300}
            height={300}
            className="pointer-events-none absolute -right-10 -top-12 hidden opacity-[0.07] lg:block"
          />
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-light-grey shadow-subtle">
            <Image
              src="/products/commercial-vrf-outdoor-unit.jpg"
              alt="Industrial refrigeration condensing units"
              fill
              sizes="(max-width:1024px) 100vw, 50vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-x-4 gap-y-1">
              {["ICE PLANTS", "RSW", "VRF", "COLD CHAIN"].map((t) => (
                <span key={t} className="font-mono text-[11px] font-medium tracking-[0.05em] text-white/90">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
