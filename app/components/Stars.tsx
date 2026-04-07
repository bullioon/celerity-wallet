"use client"

import { useEffect, useState } from "react"

type Star = {
  x: number
  y: number
  size: number
  speed: number
}

export default function Stars() {
  const [stars, setStars] = useState<Star[]>([])

  useEffect(() => {
    const generated = Array.from({ length: 60 }).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2,
      speed: Math.random() * 40 + 20,
    }))
    setStars(generated)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden z-0">
      {stars.map((s, i) => (
        <div
          key={i}
          className="absolute bg-white rounded-full opacity-60"
          style={{
            top: `${s.y}%`,
            left: `${s.x}%`,
            width: s.size,
            height: s.size,
            animation: `float ${s.speed}s linear infinite`,
          }}
        />
      ))}

      <style jsx>{`
        @keyframes float {
          from { transform: translateY(0px); }
          to { transform: translateY(-200px); }
        }
      `}</style>
    </div>
  )
}