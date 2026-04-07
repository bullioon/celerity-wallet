"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()
  const [particles, setParticles] = useState<any[]>([])

  // Generar partículas dinámicas
  useEffect(() => {
    const particleArray = Array.from({ length: 50 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 2 + 1,
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: (Math.random() - 0.5) * 0.5,
      opacity: Math.random() * 0.5 + 0.2,
    }))
    setParticles(particleArray)

    const animate = () => {
      setParticles((prev) =>
        prev.map((p) => {
          let x = p.x + p.speedX
          let y = p.y + p.speedY
          if (x > window.innerWidth) x = 0
          if (x < 0) x = window.innerWidth
          if (y > window.innerHeight) y = 0
          if (y < 0) y = window.innerHeight
          return { ...p, x, y }
        })
      )
      requestAnimationFrame(animate)
    }

    animate()
  }, [])

  return (
    <main className="relative min-h-screen bg-[#0a0a0a] text-white flex flex-col justify-between px-8 py-10 overflow-hidden">

      {/* Partículas dinámicas */}
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute bg-white rounded-full"
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            top: `${p.y}px`,
            left: `${p.x}px`,
            opacity: p.opacity,
          }}
        />
      ))}

      {/* NAV */}
      <div className="flex justify-between items-center relative z-10">
        <h1 className="text-lg tracking-[0.2em] font-light">CELERITY | GHOST WALLET</h1>
        <button className="text-xs tracking-widest text-gray-400 hover:text-white transition">
          Your money without borders 
        </button>
      </div>

      {/* HERO */}
      <div className="flex flex-col items-center text-center mt-24 relative z-10">
        <h2 className="text-6xl md:text-8xl font-semibold leading-[1.05] tracking-tight">
          Move Value <br />
          <span className="text-white/60">At Light Speed</span>
        </h2>

        {/* CTA: Botón redirige al login */}
        <button
          onClick={() => router.push("/login")}
          className="mt-12 px-10 py-4 border border-white/20 rounded-full text-sm tracking-widest hover:bg-white hover:text-black transition-all duration-300 shadow-lg relative z-10"
        >
          Join Celerity
        </button>
      </div>

      {/* FOOTER STRIP */}
      <div className="flex justify-center gap-10 text-xs text-gray-600 tracking-widest relative z-10 mt-20">
        <span>BTC</span>
        <span>SOL</span>
        <span>USDT</span>
      </div>
    </main>
  )
}