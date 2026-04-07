"use client"

import React from "react"
import { Tx } from "../hooks/useWallet"

type Props = {
  data: Tx[]
  onRelease?: (tx: Tx) => void
}

export default function Transactions({ data, onRelease }: Props) {
  if (!data || data.length === 0) {
    return <p className="text-white/30 text-center py-4">No transactions yet.</p>
  }

  return (
    <div className="space-y-4">
      {data.map((tx) => (
        <div
          key={tx.id}
          className="flex justify-between items-center p-4 bg-white/5 rounded-xl"
        >
          <div className="flex flex-col">
            <span className="text-white/80">{tx.type.toUpperCase()} - {tx.currency}</span>
            <span className="text-white/40 text-sm">{tx.date}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`font-semibold ${
              tx.type === "withdraw"
                ? "text-red-400"
                : tx.type === "deposit" || tx.type === "buy"
                ? "text-green-400"
                : "text-white"
            }`}>
              {tx.amount.toLocaleString()}
            </span>

            {/* BOTON RELEASE PARA PENDING */}
            {tx.status === "pending" && onRelease && (
              <button
                onClick={() => onRelease(tx)}
                className="px-3 py-1 text-xs bg-yellow-400/20 text-yellow-400 rounded-xl hover:bg-yellow-400/30"
              >
                Release
              </button>
            )}

            {tx.status === "completed" && (
              <span className="text-xs text-green-400">✔</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

