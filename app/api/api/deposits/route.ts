import { NextResponse } from "next/server"
import { Connection, PublicKey } from "@solana/web3.js"

const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=371a93a3-ab1b-4df3-b0ff-90b23cd5428d`
const connection = new Connection(HELIUS_RPC)

// 🔥 TU WALLET
const WALLET = new PublicKey("Hc6WiKs82cystWP2hVFzUJaBw1hebVX7sncCpL4ab1fR")

export async function GET() {
  try {
    const signatures = await connection.getSignaturesForAddress(WALLET, {
      limit: 10,
    })

    const txs = await Promise.all(
      signatures.map(async (sig) => {
        const tx = await connection.getParsedTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0,
        })

        // 🚫 evitar undefined
        if (!tx || !tx.meta || !tx.meta.preBalances || !tx.meta.postBalances) {
          return null
        }

        const pre = tx.meta.preBalances[0] ?? 0
        const post = tx.meta.postBalances[0] ?? 0
        const amount = post - pre

        // ❌ ignorar tx negativas (salidas)
        if (amount <= 0) return null

        return {
          signature: sig.signature,
          amount,
          date: sig.blockTime,
        }
      })
    )

    return NextResponse.json(txs.filter(Boolean))
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "error fetching txs" }, { status: 500 })
  }
}