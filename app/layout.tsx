import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import i18nextConfig from "../next-i18next.config";
import '../styles/globals.css'
// import { appWithTranslation, useTranslation } from 'next-i18next';
import { Toaster } from "react-hot-toast"; 
import ThemeRegistry from "@/components/Home/ThemeRegistry";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chat Bot",
  description: "Chat with AI",
  appleWebApp: {
    capable: true, 
    title: "Chatbot UI",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentLocale =  i18nextConfig.i18n.defaultLocale;
  return (
    <html lang={currentLocale}>
      <body className={inter.className}>
        <ThemeRegistry>
          <Toaster />
          {children}
        </ThemeRegistry>
      </body>
    </html>
  );
}
