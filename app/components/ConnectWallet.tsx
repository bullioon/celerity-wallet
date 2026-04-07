"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

// Import dinámico sin SSR
const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then(mod => mod.WalletMultiButton),
  { ssr: false }
)

export default function ConnectWallet() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // placeholder invisible para que no rompa la renderización
    return <div style={{ height: "40px" }} />
  }

  return (
    <div className="flex justify-center">
      <WalletMultiButton
className="
  !bg-white
  !text-black
  !rounded-xl
  !px-5 !py-2.5
  !font-medium
  hover:!bg-white/90
  !transition
  !shadow-lg
"
      />
    </div>
  )
}