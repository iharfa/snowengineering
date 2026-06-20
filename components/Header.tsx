"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/CartProvider";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/shop", label: "Shop" },
];

export function Header() {
  const pathname = usePathname();
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-light-grey bg-white/95 backdrop-blur">
      <div className="container-tech flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center" aria-label="Snow Engineering home">
          <Image src="/snow-logo.svg" alt="Snow Engineering" width={180} height={43} priority />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded px-3 py-2 text-sm font-medium text-charcoal transition-colors hover:text-primary",
                pathname === item.href && "text-primary"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/cart" className="relative p-2" aria-label="Cart">
            <ShoppingCart className="h-5 w-5 text-charcoal" />
            {count > 0 && (
              <span className="absolute -right-0 -top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
          <Link href="/contact" className="hidden sm:block">
            <Button size="sm">Request a Quote</Button>
          </Link>
          <button
            className="p-2 lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-light-grey bg-white lg:hidden">
          <div className="container-tech flex flex-col py-2">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded px-3 py-3 text-sm font-medium text-charcoal hover:bg-light-grey/30",
                  pathname === item.href && "text-primary"
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/contact" onClick={() => setOpen(false)} className="px-3 py-3">
              <Button size="sm" className="w-full">Request a Quote</Button>
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
