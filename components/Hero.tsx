import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-light-grey bg-white">
      <div className="grid-bg absolute inset-0" aria-hidden />
      <div className="container-tech relative py-16 md:py-24">
        <div className="max-w-3xl">
          <span className="label-mono text-primary">
            Refrigeration &amp; Cooling Engineering · Maldives
          </span>
          <h1 className="mt-4 font-heading text-3xl font-bold leading-tight tracking-tight text-charcoal md:text-5xl">
            Refrigeration Engineering for Fisheries, Cold Chain, and Industrial
            Cooling
          </h1>
          <p className="mt-5 max-w-2xl accent-line text-base text-on-surface-variant md:text-lg">
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
      </div>
    </section>
  );
}
