"use client"

import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { useAuth } from "./useAuth"

export type Tx = {
  id: string
  type: "deposit" | "withdraw" | "buy"
  amount: number
  currency: "SOL" | "USDC" | "BTC"
  date: string
  status?: "pending" | "completed"
}

export function useWallet() {
  const { user } = useAuth()
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<Tx[]>([])
  const [loaded, setLoaded] = useState(false) // 🔥 FIX

  // 🔥 LOAD SOLO UNA VEZ
  useEffect(() => {
    if (!user || loaded) return

    const load = async () => {
      const ref = doc(db, "users", user.uid)
      const snap = await getDoc(ref)

      if (snap.exists()) {
        const data = snap.data()

        setBalance(data.balance || 0)

        setTransactions(
          (data.transactions ?? []).map((tx: Tx) => ({
            ...tx,
            status: tx.status ?? "completed"
          }))
        )
      }

      setLoaded(true) // 🔥 CLAVE
    }

    load()
  }, [user, loaded])

  // 🔥 SAVE
  const save = async (newBalance: number, newTxs: Tx[]) => {
    if (!user) return
    const ref = doc(db, "users", user.uid)

    await updateDoc(ref, {
      balance: newBalance,
      transactions: newTxs
    })
  }

  // 💰 DEPOSIT
  const deposit = async (amount: number, currency: Tx["currency"]) => {
    const newBalance = balance + amount

    const tx: Tx = {
      id: crypto.randomUUID(),
      type: "deposit",
      amount,
      currency,
      date: new Date().toLocaleString(),
      status: "completed"
    }

    const newTxs: Tx[] = [tx, ...transactions]

    setBalance(newBalance)
    setTransactions(newTxs)

    await save(newBalance, newTxs)
  }

  // 💸 WITHDRAW
  const withdraw = async (amount: number, currency: Tx["currency"]) => {
    const tx: Tx = {
      id: crypto.randomUUID(),
      type: "withdraw",
      amount,
      currency,
      date: new Date().toLocaleString(),
      status: "pending" as const // 🔥 FIX
    }

    const newTxs: Tx[] = [tx, ...transactions]

    setTransactions(newTxs)

    if (!user) return
    const ref = doc(db, "users", user.uid)

    await updateDoc(ref, {
      transactions: newTxs
    })
  }

  // 🛒 BUY
  const buy = async (amount: number, currency: Tx["currency"]) => {
    const newBalance = balance + amount

    const tx: Tx = {
      id: crypto.randomUUID(),
      type: "buy",
      amount,
      currency,
      date: new Date().toLocaleString(),
      status: "completed"
    }

    const newTxs: Tx[] = [tx, ...transactions]

    setBalance(newBalance)
    setTransactions(newTxs)

    await save(newBalance, newTxs)
  }

  return {
    balance,
    transactions,
    deposit,
    withdraw,
    buy,
    setTransactions,
    setBalance
  }
}