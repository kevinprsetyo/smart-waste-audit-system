import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Waste Audit System — AI-Powered Waste Analysis",
  description:
    "Upload waste images for instant YOLOv8 object detection, composition statistics, and AI-generated environmental audit reports powered by Ollama Cloud.",
  keywords: ["waste audit", "AI", "YOLOv8", "recycling", "environmental", "smart waste"],
  openGraph: {
    title: "Smart Waste Audit System",
    description: "AI-Powered Waste Analysis with YOLOv8 + Ollama Cloud",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
