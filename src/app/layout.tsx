import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ToastProvider } from "@/components/ui/ToastProvider";
import FlashToastBridge from "@/components/ui/FlashToastBridge";

export const metadata: Metadata = {
  title: "CS Viriat (CSV) — Club de football",
  description:
    "CS Viriat (CSV) : club structuré, formateur, dynamique et familial. Inscriptions, équipes, calendrier et partenaires.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body
        suppressHydrationWarning
        className="min-h-screen bg-white text-neutral-900"
      >
        <ToastProvider>
          <FlashToastBridge />
          <Header />
          <main className="pt-16">{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
