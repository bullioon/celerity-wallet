"use client"

import { useEffect, useState } from "react"

export default function Balance({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    let start = 0

    const interval = setInterval(() => {
      start += value / 25
      if (start >= value) {
        start = value
        clearInterval(interval)
      }
      setDisplay(Math.floor(start))
    }, 20)

    return () => clearInterval(interval)
  }, [value])

  return (
    <h1 className="text-6xl md:text-7xl font-semibold tracking-tight">
      ${display.toLocaleString()}
    </h1>
  )
}