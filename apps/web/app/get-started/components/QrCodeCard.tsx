'use client'

import { useEffect, useState } from 'react'

import QRCode from 'qrcode'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface QrCodeCardProps {
  whatsappUrl: string
}

export function QrCodeCard({ whatsappUrl }: QrCodeCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('')

  useEffect(() => {
    QRCode.toDataURL(whatsappUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0a0f1e',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code', err))
  }, [whatsappUrl])

  return (
    <Card className="flex flex-col items-center justify-between border-white/10 bg-white/5 text-center backdrop-blur-xl transition-all duration-300 hover:border-[#4EDEA3]/50 hover:bg-white/[0.07] hover:shadow-2xl hover:shadow-emerald-500/10">
      <CardHeader className="w-full p-8 pb-4">
        <CardTitle className="mb-2 text-2xl font-bold text-white">
          On Desktop?
        </CardTitle>
        <CardDescription className="text-sm leading-relaxed text-slate-400">
          Scan this QR code with your phone camera or WhatsApp scanner to start
          chatting with Tradechat instantly.
        </CardDescription>
      </CardHeader>

      <CardContent className="my-auto flex w-full items-center justify-center p-8 py-4">
        <div
          id="qr-code-container"
          className="relative flex min-h-[220px] min-w-[220px] items-center justify-center rounded-2xl bg-white p-4 shadow-inner"
        >
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt="Scan to start on WhatsApp"
              className="h-48 w-48 object-contain sm:h-52 sm:w-52"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 text-slate-800">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#00BD85] border-t-transparent" />
              <span className="text-xs font-medium">Generating QR...</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="mt-2 w-full justify-center border-t border-white/10 p-8 pt-4 text-xs text-slate-500">
        Works with WhatsApp &amp; WhatsApp Business
      </CardFooter>
    </Card>
  )
}
