import type { ReactNode } from "react";

/** Surface container with the standard border, radius and shadow. */
export default function Card({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
}) {
  return (
    <Tag className={`rounded-card border border-line bg-surface p-5 shadow-card ${className}`}>
      {children}
    </Tag>
  );
}
