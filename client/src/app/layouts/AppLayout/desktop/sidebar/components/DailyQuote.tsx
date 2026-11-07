import { Lightbulb, RefreshCw } from "lucide-react";
import { useDailyQuote } from "../hooks/useDailyQuote";

export function DailyQuote() {
  const { quote, next } = useDailyQuote();

  return (
    <section
      aria-label="Daily focus"
      className="rounded-lg border border-line bg-brand-soft p-3"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-caption font-medium uppercase tracking-wide text-brand-ink">
          <Lightbulb aria-hidden="true" className="size-4 shrink-0 text-star" />
          Daily focus
        </p>
        <button
          type="button"
          aria-label="Show another quote"
          onClick={next}
          className="grid size-8 shrink-0 place-content-center rounded-sm text-brand-ink hover:bg-sunken"
        >
          <RefreshCw aria-hidden="true" className="size-4" />
        </button>
      </div>
      <blockquote className="mt-1.5 line-clamp-3 text-small text-ink">
        {quote.text}
      </blockquote>
      <span className="mt-2 block truncate text-caption text-muted">{quote.author}</span>
    </section>
  );
}
