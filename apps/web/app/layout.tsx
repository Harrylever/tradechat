import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Inter, Outfit, Geist, Geist_Mono } from 'next/font/google'

import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { AppProviders } from '@/providers'

const outfitHeading = Outfit({ subsets: ['latin'], variable: '--font-heading' })

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

const title = 'Tradechat'
const description =
  'Tradechat lets merchants in Africa accept payments via WhatsApp — no app, no signup required for customers. Powered by Nomba.'
const author = 'Harrylever, Dean Ukanah'
const baseUrl = 'https://tradechatapp.vercel.app'

export const metadata: Metadata = {
  title: {
    default: title,
    template: `%s | ${title}`,
  },
  description,
  authors: [{ name: author, url: 'https://deanukanah.dev' }],
  creator: author,
  applicationName: title,
  generator: 'Next.js',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  metadataBase: new URL(baseUrl),
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title,
    description,
    url: baseUrl,
    siteName: title,
    images: [
      {
        url: 'https://www.sheltahomes.com/images/logo-01.png',
        width: 1200,
        height: 630,
        alt: 'Shelta',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  alternates: {
    canonical: baseUrl,
    languages: {
      en: 'en-US',
    },
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: {
      url: 'https://www.sheltahomes.com/images/logo-01.png',
    },
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <AppProviders>
      <html
        lang="en"
        className={cn(
          'font-sans',
          inter.variable,
          outfitHeading.variable,
          geistSans.variable,
          geistMono.variable,
          'antialiased',
        )}
      >
        <body>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster
            position="top-center"
            richColors
            closeButton
            toastOptions={{
              classNames: {
                title: 'font-heading',
                description: 'font-sans',
              },
            }}
          />
        </body>
      </html>
    </AppProviders>
  )
}
