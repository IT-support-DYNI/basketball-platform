"use client";

import * as RadixToast from "@radix-ui/react-toast";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";

type Tone = "neutral" | "success" | "danger" | "warning";

type ToastInput = { title: string; description?: string; tone?: Tone };
type ToastItem = ToastInput & { id: number };

const ToastContext = createContext<(t: ToastInput) => void>(() => {});

/** Wrap the app once; call `useToast()` anywhere below it. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((t: ToastInput) => {
    setItems((prev) => [...prev, { ...t, id: Date.now() + Math.random() }]);
  }, []);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      <RadixToast.Provider swipeDirection="right" duration={5000}>
        {children}
        {items.map((t) => (
          <RadixToast.Root
            key={t.id}
            onOpenChange={(open) => !open && remove(t.id)}
            className={cn(
              "flex items-start gap-3 rounded-card border bg-surface px-4 py-3 shadow-pop",
              "data-[state=open]:animate-fade-in data-[swipe=end]:animate-fade-in motion-reduce:animate-none",
              t.tone === "success" && "border-success/40",
              t.tone === "danger" && "border-danger/40",
              t.tone === "warning" && "border-warning/40",
              (!t.tone || t.tone === "neutral") && "border-line-strong",
            )}
          >
            <div className="min-w-0 flex-1">
              <RadixToast.Title className="text-sm font-semibold text-ink">{t.title}</RadixToast.Title>
              {t.description && (
                <RadixToast.Description className="mt-0.5 text-xs text-ink-dim">
                  {t.description}
                </RadixToast.Description>
              )}
            </div>
            <RadixToast.Close
              aria-label="Dismiss"
              className="text-ink-faint transition hover:text-ink"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </RadixToast.Close>
          </RadixToast.Root>
        ))}
        <RadixToast.Viewport className="fixed bottom-0 right-0 z-[100] m-4 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2 outline-none" />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
