"use client"

import { motion } from "framer-motion"

export default function LineChart() {
  return (
    <div className="w-full h-32 mt-6">
      <svg viewBox="0 0 300 100" className="w-full h-full">
        
        <motion.path
          d="M0 80 Q 50 20, 100 50 T 200 40 T 300 20"
          stroke="url(#gradient)"
          strokeWidth="3"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5 }}
        />

        <defs>
          <linearGradient id="gradient">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>

      </svg>
    </div>
  )
}