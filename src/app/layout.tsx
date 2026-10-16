import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aetheria — A world of connection",
  description: "A little magic, a lot of meaning. Create and meet imaginative AI companions for friendship, romance, dreams, and life's little moments. Private and offline-ready.",
  applicationName: "Aetheria",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg" },
  openGraph: { title: "Aetheria — A world of connection", description: "A little magic, a lot of meaning. Meet companions and create a world that feels like yours.", images: ["/images/hero-dreamscape.jpg"] },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
