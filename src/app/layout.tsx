import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Админка",
  description: "Управление магазином",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
