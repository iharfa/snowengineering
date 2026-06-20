"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Label } from "@/components/ui/input";
import { useCart } from "@/components/CartProvider";
import { WhatsAppOrderButton } from "@/components/WhatsAppOrderButton";
import { customerSchema, type Customer } from "@/lib/order";

export function CheckoutForm() {
  const router = useRouter();
  const { items, clear } = useCart();
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<Customer>({
    resolver: zodResolver(customerSchema),
    defaultValues: { preferredContact: "WhatsApp" },
  });

  async function onEmail(customer: Customer) {
    setStatus("sending");
    try {
      const res = await fetch("/api/orders/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer, items }),
      });
      if (!res.ok) throw new Error();
      clear();
      router.push("/thank-you?via=email");
    } catch {
      setStatus("error");
    }
  }

  const disabled = items.length === 0;

  return (
    <form onSubmit={handleSubmit(onEmail)} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" error={errors.name?.message}>
          <Input {...register("name")} aria-invalid={!!errors.name} />
        </Field>
        <Field label="Company" error={errors.company?.message}>
          <Input {...register("company")} />
        </Field>
        <Field label="Phone" error={errors.phone?.message}>
          <Input type="tel" {...register("phone")} aria-invalid={!!errors.phone} />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" {...register("email")} aria-invalid={!!errors.email} />
        </Field>
        <Field label="Island / delivery location" error={errors.location?.message}>
          <Input {...register("location")} aria-invalid={!!errors.location} />
        </Field>
        <Field label="Preferred contact method" error={errors.preferredContact?.message}>
          <Select {...register("preferredContact")}>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Email">Email</option>
            <option value="Phone">Phone</option>
          </Select>
        </Field>
      </div>
      <Field label="Order notes" error={errors.orderNotes?.message}>
        <Textarea
          {...register("orderNotes")}
          placeholder="Delivery constraints, project context, model preferences…"
        />
      </Field>

      {status === "error" && (
        <p className="text-sm" style={{ color: "#ba1a1a" }}>
          Could not send the email order. Please try WhatsApp or contact us
          directly.
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" disabled={disabled || status === "sending"} className="flex-1">
          {status === "sending" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mail className="h-4 w-4" />
          )}
          Send Order by Email
        </Button>
        <WhatsAppOrderButton
          items={items}
          getCustomer={getValues}
          validate={() =>
            customerSchema.safeParse(getValues()).success
          }
          disabled={disabled}
        />
      </div>
      <p className="label-mono normal-case tracking-normal text-steel">
        Submitting creates an order inquiry, not a final invoice. Quotations and
        tax invoices are issued from our office after confirmation.
      </p>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {error && (
        <p className="mt-1 text-xs" style={{ color: "#ba1a1a" }}>
          {error}
        </p>
      )}
    </div>
  );
}
