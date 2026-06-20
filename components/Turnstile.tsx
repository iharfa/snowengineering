"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

// Renders a Cloudflare Turnstile widget when NEXT_PUBLIC_TURNSTILE_SITE_KEY is
// set; otherwise renders nothing (token stays empty and the server skips
// verification). onToken receives the current token ("" when reset/expired).

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function Turnstile({ onToken }: { onToken: (t: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const done = useRef(false);

  function render() {
    if (done.current || !ref.current || !window.turnstile) return;
    done.current = true;
    window.turnstile.render(ref.current, {
      sitekey: SITE_KEY,
      callback: (t: string) => onToken(t),
      "expired-callback": () => onToken(""),
      "error-callback": () => onToken(""),
    });
  }

  // Handle the case where the script was already loaded by a prior mount.
  useEffect(() => {
    render();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!SITE_KEY) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={render}
      />
      <div ref={ref} className="min-h-[65px]" />
    </>
  );
}
