import { Poppins, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata, Viewport } from 'next';

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Quizzi - Challenge Your Knowledge',
  description: 'Compete with friends in exciting quiz battles across various topics',
  keywords: 'quiz, trivia, challenge, friends, knowledge, education',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#FF267A',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${poppins.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground min-h-screen flex flex-col items-center font-sans`}
      >
        <div className="w-full max-w-screen-xl mx-auto min-h-screen flex flex-col">
          <Header/>
          <main className="flex-1 px-2 sm:px-4 lg:px-0">
            {children}
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
