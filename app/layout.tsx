import type { Metadata } from 'next'
import './globals.css'
import { ToastContainer } from '@/components/ToastContainer'

export const metadata: Metadata = {
  title: 'TikTok Op',
  description: 'Gestão da operação TikTok Ads',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `document.documentElement.style.background='#0C0E14'` }} />
        <style>{`html,body{background:#0C0E14!important}`}</style>
      </head>
      <body suppressHydrationWarning>
        {children}
        <ToastContainer />
      </body>
    </html>
  )
}
