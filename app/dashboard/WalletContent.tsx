"use client"

import { useEffect, useState } from "react"
import { signOut } from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { doc, updateDoc, onSnapshot } from "firebase/firestore"
import { QRCodeSVG } from "qrcode.react"

import Stars from "../components/Stars"
import Card from "../components/Card"
import Balance from "../components/Balance"
import Actions from "../components/Actions"
import { useWallet, Tx } from "../hooks/useWallet"

// ---------------- TRANSACTIONS ----------------
function TransactionsTech({
  data,
  onRelease,
  solPrice,
  timerMap = {}
}: {
  data: Tx[]
  onRelease: (tx: Tx) => void
  solPrice: number
  timerMap?: Record<string, number>
}) {
  const visibleTxs = data.slice(0, 3)

  return (
    <div className="space-y-4 w-full max-w-md mx-auto">
      {visibleTxs.map((tx: Tx) => {
        const solAmount = (tx.amount / solPrice).toFixed(4)
        const remainingTime = timerMap[tx.id] ?? 0
        const isWithdraw = tx.type === "withdraw"

        return (
          <div
            key={tx.id}
            className="flex justify-between items-center px-5 py-4 rounded-2xl bg-gradient-to-r from-white/5 via-white/10 to-white/5 border border-white/10 backdrop-blur-xl shadow-lg hover:scale-[1.02] transition-transform duration-300 w-full"
          >
            <div className="flex flex-col">
              <p className="text-xs text-white/50 tracking-wide uppercase">{tx.type}</p>
              <p className="text-white font-semibold text-lg">
                ${tx.amount} USD ≈ {solAmount} SOL
              </p>
              <p className="text-[10px] text-white/40 mt-1">{tx.date}</p>
            </div>

            <div className="flex flex-col items-end space-y-2">
              {isWithdraw && tx.status === "pending" ? (
                <span className="text-xs font-semibold tracking-wide text-purple-400 bg-purple-900/20 px-3 py-1 rounded-full">
                  Pending {remainingTime > 0
                    ? `- ${Math.floor(remainingTime / 60)}:${(remainingTime % 60).toString().padStart(2,"0")}`
                    : "- Canceled"}
                </span>
              ) : (
                <span className={`text-xs font-semibold tracking-wide ${
                  tx.status === "completed"
                    ? "text-green-400 bg-green-800/20 px-3 py-1 rounded-full"
                    : "text-red-400"
                }`}>
                  {tx.status}
                </span>
              )}

              {isWithdraw && tx.status === "pending" && remainingTime > 0 && (
                <button
                  onClick={() => onRelease(tx)}
                  className="px-3 py-1 text-xs rounded-lg border border-white/20 text-white/60 hover:text-white hover:border-white transition"
                >
                  Release
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ---------------- WALLET ----------------
export default function WalletContent({ user }: { user: any }) {
  const MIN_WITHDRAW = 4009
  const SOL_PRICE = 150

  const [timerMap, setTimerMap] = useState<Record<string, number>>({})
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [withdrawAddress, setWithdrawAddress] = useState("")
  const [releaseTx, setReleaseTx] = useState<Tx | null>(null)
  const [errorMsg, setErrorMsg] = useState("")
  const [showDepositOptions, setShowDepositOptions] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState<Tx["currency"]>("SOL")

  const { balance, transactions, setTransactions, setBalance } = useWallet()

  // ---------------- FIREBASE (FIX DEPOSIT) ----------------
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      const data = docSnap.data()
      if (!data) return

      setBalance(prev => {
        const newBalance = data.balance
        let updatedTxs: Tx[] = data.transactions || []

        if (newBalance > prev) {
          const diff = newBalance - prev

          const exists = updatedTxs.some(
            (tx: Tx) => tx.type === "deposit" && tx.amount === diff
          )

          if (!exists) {
            const depositTx: Tx = {
              id: crypto.randomUUID(),
              type: "deposit",
              amount: diff,
              currency: "USDC",
              date: new Date().toLocaleString(),
              status: "completed"
            }

            updatedTxs = [depositTx, ...updatedTxs]
          }
        }

        setTransactions(updatedTxs)
        return newBalance
      })
    })

    return () => unsub()
  }, [user.uid])

  // ---------------- LOAD TIMERS ----------------
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("withdrawTimers") || "{}")
    setTimerMap(saved)
  }, [])

  // ---------------- COUNTDOWN ----------------
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerMap(prev => {
        const updated: Record<string, number> = {}
        Object.entries(prev).forEach(([id, t]) => {
          if (t > 0) updated[id] = t - 1
        })
        localStorage.setItem("withdrawTimers", JSON.stringify(updated))
        return updated
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // ---------------- EXPIRE ----------------
  useEffect(() => {
    Object.entries(timerMap).forEach(([id, t]) => {
      if (t <= 0) {
        setTransactions(prevTxs =>
          prevTxs.map(tx => {
            if (tx.id === id && tx.status === "pending") {
              setBalance(prev => prev + tx.amount)
              return { ...tx, status: "canceled" }
            }
            return tx
          })
        )

        setTimerMap(prev => {
          const copy = { ...prev }
          delete copy[id]
          localStorage.setItem("withdrawTimers", JSON.stringify(copy))
          return copy
        })
      }
    })
  }, [timerMap])

  // ---------------- WITHDRAW ----------------
  const handleWithdraw = async () => {
    const amount = Number(withdrawAmount)
    if (!amount || !withdrawAddress) return

    if (amount < MIN_WITHDRAW) {
      setErrorMsg(`Minimum withdrawal is ${MIN_WITHDRAW}`)
      return
    }

    if (amount > balance) {
      setErrorMsg("Not enough balance")
      return
    }

    const tx: Tx = {
      id: crypto.randomUUID(),
      type: "withdraw",
      amount,
      currency: "SOL",
      date: new Date().toLocaleString(),
      status: "pending"
    }

    const newTxs = [tx, ...transactions]

    setTransactions(newTxs)
    setBalance(prev => prev - amount)

    await updateDoc(doc(db, "users", user.uid), {
      transactions: newTxs,
      balance: balance - amount
    })

    // 🔥 TIMER 15 MIN
    const newTimers = {
      ...timerMap,
      [tx.id]: 900
    }

    setTimerMap(newTimers)
    localStorage.setItem("withdrawTimers", JSON.stringify(newTimers))

    // 🚀 REDIRECT
    window.location.href = "/solana"
  }

  return (
    <div className="relative min-h-screen text-white overflow-hidden">

      <button
        onClick={async () => {
          await signOut(auth)
          window.location.href = "/login"
        }}
        className="absolute top-6 right-6 text-xs text-white/40 z-50"
      >
        Logout
      </button>

      <Stars />

      <div className="relative z-10 flex flex-col items-center px-6 pt-24 pb-32 space-y-8">

        {/* BALANCE */}
        <div className="text-center relative z-50">
          <p className="text-white/30 tracking-[0.35em] text-xs uppercase mb-1">Total Balance</p>
          <Balance value={balance} />
        </div>

        {/* ACTIONS */}
        <div className="w-full max-w-md">
          <Actions
            onDeposit={() => setShowDepositOptions(true)}
            onWithdraw={() => setShowWithdraw(true)}
          />
        </div>

        {/* CARD */}
        <div className="w-full max-w-md">
          <Card />
        </div>

        {/* TRANSACTIONS */}
        <TransactionsTech
          data={transactions}
          onRelease={(tx: Tx) => setReleaseTx(tx)}
          solPrice={SOL_PRICE}
          timerMap={timerMap}
        />
      </div>

{showDepositOptions && (
  <div className="fixed inset-0 z-50 flex flex-col justify-end">
    <div
      className="absolute inset-0 bg-black/70"
      onClick={() => setShowDepositOptions(false)}
    />

    <div className="relative bg-[#0a0a0a] rounded-3xl p-6 pb-10 border border-white/20 backdrop-blur-xl shadow-2xl">

      <h2 className="text-center text-lg mb-4 font-extrabold text-white/80 tracking-wide">
        Deposit
      </h2>

      {/* 🔳 QR */}
      <div className="flex justify-center mb-4">
        <div className="bg-white p-3 rounded-xl shadow-2xl">
          <QRCodeSVG
            value="Hc6WiKs82cystWP2hVFzUJaBw1hebVX7sncCpL4ab1fR"
            size={160}
          />
        </div>
      </div>

      {/* 💳 WALLET */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center mb-3">
        <p className="text-xs text-white/40 mb-1 tracking-widest uppercase">
          Wallet Address
        </p>

        <p className="text-white/80 text-xs break-all">
          Hc6WiKs82cystWP2hVFzUJaBw1hebVX7sncCpL4ab1fR
        </p>
      </div>

      {/* 📋 COPY BUTTON */}
      <button
        onClick={() => {
          navigator.clipboard.writeText("Hc6WiKs82cystWP2hVFzUJaBw1hebVX7sncCpL4ab1fR")
        }}
        className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 text-black font-semibold shadow-lg hover:shadow-2xl transition-all duration-300"
      >
        Copy Address
      </button>

    </div>
  </div>
)}

      {/* WITHDRAW MODAL ORIGINAL */}
      {showWithdraw && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowWithdraw(false)} />
          <div className="relative bg-[#1a1a1a] rounded-3xl p-6 pb-10 border border-white/20 backdrop-blur-xl shadow-2xl">

            <input
              value={withdrawAddress}
              onChange={(e) => setWithdrawAddress(e.target.value)}
              placeholder="Wallet address"
              className="w-full mb-3 px-4 py-3 rounded-xl bg-white/5"
            />

            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder={`Amount (USD) min ${MIN_WITHDRAW}`}
              className="w-full mb-4 px-4 py-3 rounded-xl bg-white/5"
            />

            <button
              onClick={handleWithdraw}
              className="w-full py-3 rounded-2xl bg-purple-600 text-black font-semibold"
            >
              Withdraw
            </button>

            {errorMsg && (
              <div className="mt-3 text-red-400 text-sm text-center">
                {errorMsg}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}