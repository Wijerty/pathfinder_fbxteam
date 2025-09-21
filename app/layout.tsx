import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { StoreInitializer } from '@/components/StoreInitializer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PathFinder - AI HR Консультант',
  description: 'Корпоративная система управления карьерой с ИИ-помощником',
  keywords: ['HR', 'AI', 'карьера', 'навыки', 'развитие'],
  authors: [{ name: 'PathFinder Team' }],
  robots: 'noindex, nofollow', // Внутренняя корпоративная система
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={inter.className}>
        <StoreInitializer />
        <div id="root">
          {children}
        </div>
        {/* Portal для модальных окон */}
        <div id="modal-root"></div>
        {/* Portal для toast уведомлений */}
        <div id="toast-root"></div>
      </body>
    </html>
  )
}
