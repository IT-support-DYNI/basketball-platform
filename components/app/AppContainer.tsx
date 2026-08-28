import { cn } from "@/lib/cn";

/**
 * The one page frame every signed-in screen sits in. Fluid gutters that grow
 * with the viewport, and bottom room on small screens so content clears the
 * fixed mobile nav bar (`components/nav/BottomNav.tsx`).
 */
export default function AppContainer({
  children,
  width = "app",
  className,
}: {
  children: React.ReactNode;
  width?: "app" | "prose";
  className?: string;
}) {
  return (
    <div
      className={cn(
        // fluid gutters; generous bottom room so content clears the fixed
        // mobile nav bar, dropped back to normal once the bar is gone at lg
        "mx-auto w-full px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-8 lg:px-8 lg:pb-10",
        width === "prose" ? "max-w-3xl" : "max-w-6xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
