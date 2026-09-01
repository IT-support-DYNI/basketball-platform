"use client";

import { SessionProvider } from "next-auth/react";

import { ToastProvider } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/Tooltip";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TooltipProvider delayDuration={200} skipDelayDuration={300}>
        <ToastProvider>{children}</ToastProvider>
      </TooltipProvider>
    </SessionProvider>
  );
}
