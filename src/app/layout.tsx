import type { Metadata } from 'next'
import { AppProviders } from '@/components/AppProviders'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://puddlesmap.com'),
  title: {
    default: 'Puddles the tot map | Bay Area Activities for Ages 0–5',
    template: '%s',
  },
  description:
    'Find storytimes, music, drop-ins, library events, community programs, and local family activities for ages 0–5 in the Bay Area.',
}

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode
  modal: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@300&family=Nunito+Sans:ital,opsz,wght@0,6..12,300;0,6..12,400;0,6..12,500;0,6..12,600;0,6..12,700;1,6..12,400&family=Quicksand:wght@700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AppProviders>
          {children}
          {modal}
        </AppProviders>
      </body>
    </html>
  )
}
