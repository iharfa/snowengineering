"use client";

import { useState } from "react";
import { Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMVR } from "@/lib/utils";
import type { Product } from "@/lib/types";

export interface RevealResult {
  price: number;
  currency: string;
  gstRate: number;
  gstAmount: number;
  estimatedTotal: number;
}

function sessionId() {
  if (typeof window === "undefined") return "server";
  let id = sessionStorage.getItem("snow-session");
  if (!id) {
    id = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem("snow-session", id);
  }
  return id;
}

export function RevealPriceButton({
  product,
  onReveal,
}: {
  product: Pick<Product, "id" | "name" | "category" | "erpnextItemCode">;
  onReveal?: (r: RevealResult) => void;
}) {
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [result, setResult] = useState<RevealResult | null>(null);

  async function reveal() {
    setState("loading");
    try {
      const res = await fetch("/api/price-reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          itemCode: product.erpnextItemCode,
          productName: product.name,
          category: product.category,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          referrer: document.referrer,
          sessionId: sessionId(),
        }),
      });
      if (!res.ok) throw new Error("reveal failed");
      const data: RevealResult = await res.json();
      setResult(data);
      setState("idle");
      onReveal?.(data);
    } catch {
      setState("error");
    }
  }

  if (result) {
    return (
      <div className="rounded border border-light-grey bg-background px-3 py-2">
        <div className="font-heading text-lg font-bold text-charcoal">
          {formatMVR(result.price, result.currency)}
        </div>
        <div className="label-mono mt-0.5 normal-case tracking-normal">
          incl. est. GST {result.gstRate}% ·{" "}
          {formatMVR(result.estimatedTotal, result.currency)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={reveal}
        disabled={state === "loading"}
      >
        {state === "loading" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
        {state === "loading" ? "Revealing…" : "Price hidden. Click to reveal."}
      </Button>
      {state === "error" && (
        <p className="mt-1 text-xs text-error" style={{ color: "#ba1a1a" }}>
          Could not load price. Please try again.
        </p>
      )}
    </div>
  );
}
