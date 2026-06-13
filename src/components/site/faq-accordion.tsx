"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { FAQRow } from "@/lib/types/database";
import { cn } from "@/lib/utils";

export function FAQAccordion({ items }: { items: FAQRow[] }) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);
  return (
    <div className="max-w-3xl mx-auto">
      {items.map((item) => {
        const isOpen = open === item.id;
        return (
          <div key={item.id} className="border-b border-border">
            <button
              type="button"
              id={`faq-q-${item.id}`}
              onClick={() => setOpen(isOpen ? null : item.id)}
              className="w-full text-left flex items-start justify-between gap-4 py-6 group"
              aria-expanded={isOpen}
              aria-controls={`faq-a-${item.id}`}
            >
              <span className="t-heading-l font-display group-hover:text-brand-500 transition">
                {item.question}
              </span>
              <ChevronDown
                className={cn(
                  "w-5 h-5 text-muted flex-shrink-0 mt-1 transition-transform",
                  isOpen && "rotate-180 text-fg",
                )}
              />
            </button>
            <div
              id={`faq-a-${item.id}`}
              role="region"
              aria-labelledby={`faq-q-${item.id}`}
              // `inert` + `aria-hidden` keep the CSS collapse animation while
              // removing a closed answer from focus order and the a11y tree
              // (a 0fr grid still leaves the text reachable to AT otherwise).
              inert={!isOpen}
              aria-hidden={!isOpen}
              className={cn(
                "grid transition-all duration-300",
                isOpen ? "grid-rows-[1fr] pb-6" : "grid-rows-[0fr]",
              )}
            >
              <div className="overflow-hidden">
                <p className="t-body text-muted max-w-2xl whitespace-pre-wrap">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
