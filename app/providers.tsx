"use client";

import { SessionProvider } from "next-auth/react";

import { ToastProvider } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/Tooltip";
import DisplayPreferencesSync from "@/components/theme/DisplayPreferencesSync";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DisplayPreferencesSync />
      <TooltipProvider delayDuration={200} skipDelayDuration={300}>
        <ToastProvider>{children}</ToastProvider>
      </TooltipProvider>
    </SessionProvider>
  );
}
