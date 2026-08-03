import type { Metadata } from "next";
import "./globals.css";
import "@/styles/habla.css";

export const metadata: Metadata = {
  title: "Habla — Tutor de inglés",
  description:
    "Tu tutor conversacional de inglés — practica, lee y escucha con corrección en tiempo real, a tu nivel.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Inter:wght@400;500;600&family=Caveat:wght@600;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
