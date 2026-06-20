import type { LucideIcon } from "lucide-react";

export function ServiceCard({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="tech-card p-5 transition-shadow hover:shadow-subtle">
      <div className="flex h-10 w-10 items-center justify-center rounded bg-accent/30 text-primary">
        <Icon className="h-5 w-5" strokeWidth={2} />
      </div>
      <h3 className="mt-4 font-heading text-lg font-semibold text-charcoal">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
        {description}
      </p>
    </div>
  );
}
