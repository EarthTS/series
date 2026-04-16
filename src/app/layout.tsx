import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import { AppStateProvider } from "@/context/app-state";
import "./globals.css";

const noto = Noto_Sans_Thai({
  variable: "--font-noto",
  subsets: ["latin", "thai"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Winter Series — ดูซีรี่ออนไลน์",
  description: "สตรีมมิ่งซีรี่แนวตั้ง สมัครสมาชิก 29 บาท/เดือน",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${noto.variable} h-full antialiased`}>
      <body className="min-h-full">
        <AppStateProvider>{children}</AppStateProvider>
      </body>
    </html>
  );
}
