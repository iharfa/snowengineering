"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  company: z.string().optional(),
  email: z.string().email("Valid email required"),
  phone: z.string().min(5, "Phone is required"),
  message: z.string().min(10, "Please describe your requirement"),
});
type ContactValues = z.infer<typeof schema>;

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: ContactValues) {
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error();
      setStatus("sent");
      reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="tech-card flex items-start gap-3 p-6">
        <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-primary" />
        <div>
          <h3 className="font-heading font-semibold text-charcoal">
            Message received
          </h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            Thank you. Our engineering team will get back to you shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" error={errors.name?.message}>
          <Input {...register("name")} />
        </Field>
        <Field label="Company" error={errors.company?.message}>
          <Input {...register("company")} />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" {...register("email")} />
        </Field>
        <Field label="Phone" error={errors.phone?.message}>
          <Input type="tel" {...register("phone")} />
        </Field>
      </div>
      <Field label="How can we help?" error={errors.message?.message}>
        <Textarea
          {...register("message")}
          placeholder="Describe your refrigeration, cooling, or spare parts requirement…"
        />
      </Field>
      {status === "error" && (
        <p className="text-sm" style={{ color: "#ba1a1a" }}>
          Could not send your message. Please email us directly.
        </p>
      )}
      <Button type="submit" disabled={status === "sending"}>
        {status === "sending" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        Send Message
      </Button>
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
