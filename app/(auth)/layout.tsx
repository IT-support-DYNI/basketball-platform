import type { Metadata } from "next";
import type { ReactNode } from "react";

/** Sign in, register and the password screens: keep them out of search
 *  results (the club site is what people should land on), but let crawlers
 *  follow the links back to it. */
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return children;
}
