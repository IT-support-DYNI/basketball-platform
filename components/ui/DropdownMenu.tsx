"use client";

import * as RadixMenu from "@radix-ui/react-dropdown-menu";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export const DropdownMenu = RadixMenu.Root;
export const DropdownMenuTrigger = RadixMenu.Trigger;

export function DropdownMenuContent({
  children,
  align = "end",
}: {
  children: ReactNode;
  align?: "start" | "center" | "end";
}) {
  return (
    <RadixMenu.Portal>
      <RadixMenu.Content
        align={align}
        sideOffset={6}
        className="z-50 min-w-[10rem] overflow-hidden rounded-card border border-line-strong bg-surface p-1 shadow-pop data-[state=open]:animate-fade-in motion-reduce:animate-none"
      >
        {children}
      </RadixMenu.Content>
    </RadixMenu.Portal>
  );
}

const itemClass =
  "flex w-full cursor-pointer items-center gap-2 rounded-control px-2.5 py-1.5 text-sm text-ink-dim outline-none transition data-[highlighted]:bg-surface-2 data-[highlighted]:text-ink";

export function DropdownMenuItem({
  children,
  onSelect,
  href,
  tone,
}: {
  children: ReactNode;
  onSelect?: () => void;
  href?: string;
  tone?: "danger";
}) {
  const cls = cn(itemClass, tone === "danger" && "text-danger data-[highlighted]:text-danger");
  if (href) {
    return (
      <RadixMenu.Item asChild onSelect={onSelect}>
        <Link href={href} className={cls}>
          {children}
        </Link>
      </RadixMenu.Item>
    );
  }
  return (
    <RadixMenu.Item className={cls} onSelect={onSelect}>
      {children}
    </RadixMenu.Item>
  );
}

export function DropdownMenuSeparator() {
  return <RadixMenu.Separator className="my-1 h-px bg-line" />;
}
