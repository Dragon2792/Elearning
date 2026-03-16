import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodeLearn AI - Platform E-Learning Pemrograman",
  description: "Belajar pemrograman dengan AI Tutor otomatis",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
