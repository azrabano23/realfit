import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RealFit - AI-Powered Social Fitness',
  description: 'BeReal-style social fitness app with AI form analysis',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-black text-white">{children}</body>
    </html>
  )
}


