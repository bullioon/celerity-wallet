"use client"

import { useState } from "react"
import { motion } from "framer-motion"

export default function Card() {
  const [show, setShow] = useState(false)

  return (
    <motion.div
      onClick={() => setShow(!show)}
      whileTap={{ scale: 0.98 }}
      className="relative w-full h-56 rounded-2xl p-6 cursor-pointer
      bg-white/[0.03] border border-white/10 backdrop-blur-xl"
    >
      {/* subtle glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl" />

      <div className="flex justify-between items-start">
        <p className="text-xs text-white/30 tracking-widest">
          DIGITAL CARD
        </p>

      </div>

      <div className="mt-10 text-lg tracking-[0.25em] font-mono">
        {show
          ? "5371 0074 1565 3737"
          : "•••• •••• •••• 3737"}
      </div>

      <div className="flex justify-between mt-8 text-xs text-white/40">
        <div>
          <p>VALID</p>
          <p className="text-white">{show ? "01/29" : "**/**"}</p>
        </div>

        <div>
          <p>CVV</p>
          <p className="text-white">{show ? "560" : "***"}</p>
        </div>
      </div>
    </motion.div>
  )
}