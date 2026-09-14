import { BasketballSpinner } from "@/components/ui/BasketballSpinner";

/** Next's Suspense boundary for a full route change — see BasketballSpinner
 *  for why this is the one place a spinner (not a content-shaped skeleton)
 *  is the right call. */
export default function Loading() {
  return <BasketballSpinner label="Loading page" />;
}
