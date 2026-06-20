import Link from "next/link";

const cols = [
  {
    title: "Services",
    links: [
      { href: "/services", label: "Refrigeration Consultancy" },
      { href: "/services", label: "Ice Plant Design" },
      { href: "/services", label: "RSW Systems" },
      { href: "/services", label: "Troubleshooting" },
    ],
  },
  {
    title: "Quick Links",
    links: [
      { href: "/shop", label: "Shop" },
      { href: "/projects", label: "Projects" },
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-light-grey bg-charcoal text-white">
      <div className="container-tech grid gap-10 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="font-heading text-lg font-bold">Snow Engineering</div>
          <p className="mt-3 max-w-sm text-sm text-light-grey">
            Refrigeration and cooling engineering consultancy for the fisheries
            sector, cold chain, resorts, and institutions across the Maldives.
          </p>
        </div>
        {cols.map((col) => (
          <div key={col.title}>
            <div className="label-mono text-accent">{col.title}</div>
            <ul className="mt-4 space-y-2 text-sm">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-light-grey hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="container-tech flex flex-col gap-2 py-5 text-xs text-light-grey sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Snow Engineering. Malé City, Maldives.</span>
          <span>Prices and availability are subject to confirmation.</span>
        </div>
      </div>
    </footer>
  );
}
