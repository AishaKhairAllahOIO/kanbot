import type { ReactNode } from "react";
import { CircleAlert, Inbox } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  error?: boolean;
  accent?: "brand" | "info";
}

export function EmptyState({
  title,
  description,
  action,
  error = false,
  accent = "brand",
}: EmptyStateProps) {
  const Icon = error ? CircleAlert : Inbox;
  const iconClasses = error
    ? "bg-danger/10 text-danger"
    : accent === "info"
      ? "bg-info/10 text-info"
      : "bg-brand-soft text-brand-ink";
  return (
    <section
      className="flex min-h-48 flex-col items-center justify-center gap-3 px-4 py-8 text-center"
      aria-live="polite"
    >
      <span className={`grid size-12 place-content-center rounded-full ${iconClasses}`}>
        <Icon aria-hidden="true" className="size-6" />
      </span>
      <h2 className="font-heading text-heading font-semibold tracking-tight text-ink">
        {title}
      </h2>
      <p className="max-w-prose text-body text-muted">{description}</p>
      {action}
    </section>
  );
}
