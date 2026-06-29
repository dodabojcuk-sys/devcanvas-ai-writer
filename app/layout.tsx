import type { ReactNode } from "react"

import "./globals.css"

export const metadata = {
  title: "New DevCanvas",
  description: "Clean DevCanvas runtime with AI Tianyi as the only entry.",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
