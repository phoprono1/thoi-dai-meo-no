import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { SoundProvider } from "@/contexts/SoundContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ngạo Thiên 88",
  description: "Bộ sưu tập mini-games online dành cho bạn bè",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <SoundProvider>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              minHeight: 0,
            }}
          >
            {children}
          </div>
        </SoundProvider>
      </body>
    </html>
  );
}
