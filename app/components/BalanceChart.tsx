"use client"

import { useEffect, useState } from "react"

export default function Balance() {
  const [value, setValue] = useState(0)
  const target = 17382

  useEffect(() => {
    let start = 0

    const interval = setInterval(() => {
      start += target / 30
      if (start >= target) {
        start = target
        clearInterval(interval)
      }
      setValue(Math.floor(start))
    }, 30)

    return () => clearInterval(interval)
  }, [])

  return (
    <h1 className="text-5xl font-bold">
      ${value.toLocaleString()}
    </h1>
  )
}