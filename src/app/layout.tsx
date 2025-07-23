import { Poppins, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata, Viewport } from 'next';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from '@vercel/analytics/next';

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
  description: 'Compete with friends in exciting quiz battles across various topics. Play real-time 1v1 trivia matches, choose from a wide range of topics, and track your scores. Powered by Supabase and optimized for mobile.',
  keywords: [
    'quiz',
    'trivia',
    'challenge',
    'friends',
    'knowledge',
    'education',
    'real-time',
    '1v1',
    'mobile',
    'Supabase',
    'Next.js',
    'QuizUp alternative'
  ],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/logo.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/logo.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  openGraph: {
    title: 'Quizzi - Challenge Your Knowledge',
    description: 'Play real-time 1v1 trivia matches and challenge friends across various topics.',
    url: 'https://quizzi-eight.vercel.app',
    siteName: 'Quizzi',
    images: [
      {
        url: 'https://quizzi-eight.vercel.app/logo.png',
        width: 512,
        height: 512,
        alt: 'Quizzi - Challenge Your Knowledge',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Quizzi - Challenge Your Knowledge',
    description: 'Compete in real-time 1v1 trivia matches and challenge your friends.',
    images: ['https://quizzi-eight.vercel.app/logo.png'],
    creator: '@haveYouMetSam_',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
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
            <SpeedInsights />
            <Analytics />
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
