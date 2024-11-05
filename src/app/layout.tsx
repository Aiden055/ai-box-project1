import './globals.css'

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
      <body>{children}</body>
    </html>
  )
}