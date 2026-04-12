// app/layout.tsx
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import Providers from "./providers"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Celerity",
  description: "Next-gen wallet",
  icons: {
    icon: "/C.ico", // <-- aquí pones tu favicon
  },
  openGraph: {
    title: "Celerity | Ghost Wallet",
    description: "Move value at light speed. Anonymous & zero fees.",
    images: ["/preview.png"], // tu imagen de preview
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Celerity | Ghost Wallet",
    description: "Move value at light speed. Anonymous & zero fees.",
    images: ["/preview.png"],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}