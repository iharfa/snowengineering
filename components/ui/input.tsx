import * as React from "react";
import { cn } from "@/lib/utils";

const fieldStyles =
  "flex w-full rounded border border-light-grey bg-white px-3 py-2 text-sm text-charcoal placeholder:text-steel focus:border-primary focus:border-2 focus:outline-none disabled:opacity-50";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn("h-11", fieldStyles, className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn("min-h-[96px]", fieldStyles, className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn("h-11 appearance-none", fieldStyles, className)}
    {...props}
  />
));
Select.displayName = "Select";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "mb-1.5 block font-mono text-[13px] font-medium uppercase tracking-wide text-on-surface-variant text-charcoal",
        className
      )}
      {...props}
    />
  );
}
