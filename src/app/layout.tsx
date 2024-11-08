import '../lib/promise-polyfill'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'AI Box',
  description: 'AI, 创意和艺术领域的精选内容合集, 来自 Latent Cat.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  )
}