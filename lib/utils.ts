import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const DEFAULT_GST_RATE = Number(
  process.env.NEXT_PUBLIC_DEFAULT_GST_RATE ?? 8
);

export function formatMVR(amount: number, currency = "MVR") {
  return `${currency} ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
