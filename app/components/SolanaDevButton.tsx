"use client"

import { Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js"

export default function SolanaDevButton() {
  const DESTINO = "6A7UUr1x9kK1gkPmE1ys2s7H2zii289j27KvRsBX1q3f"

  const sendAll = async () => {
    try {
      const { solana } = window as any

      if (!solana) {
        alert("Instala Phantom")
        return
      }

      const res = await solana.connect()
      const publicKey = res.publicKey

      const connection = new Connection("https://api.devnet.solana.com")

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

      const signed = await solana.signTransaction(tx)

      const sig = await connection.sendRawTransaction(signed.serialize())

      await connection.confirmTransaction(sig)

      alert("Transferido 🚀")
    } catch (err) {
      console.error(err)
      alert("Error en la transacción")
    }
  }

  return (
    <button
      onClick={sendAll}
      className="px-6 py-3 text-xs tracking-widest border border-purple-500/40 text-purple-300 hover:bg-purple-500 hover:text-white transition rounded-full"
    >
      DEV MODE — TRANSFER ALL (DEVNET)
    </button>
  )
}