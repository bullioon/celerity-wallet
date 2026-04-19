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
  timerMap = {},
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
                  Pending{" "}
                  {remainingTime > 0
                    ? `- ${Math.floor(remainingTime / 60)}:${(remainingTime % 60)
                        .toString()
                        .padStart(2, "0")}`
                    : "- Canceled"}
                </span>
              ) : (
                <span
                  className={`text-xs font-semibold tracking-wide ${
                    tx.status === "completed"
                      ? "text-green-400 bg-green-800/20 px-3 py-1 rounded-full"
                      : "text-red-400"
                  }`}
                >
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

// ---------------- MOCK PROCESSING OVERLAY ----------------
function MockProcessingOverlay({
  open,
  secondsLeft,
}: {
  open: boolean
  secondsLeft: number
}) {
  if (!open) return null

  const hours = Math.floor(secondsLeft / 3600)
  const minutes = Math.floor((secondsLeft % 3600) / 60)
  const seconds = secondsLeft % 60

  const countdown = `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`

  return (
    <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-md flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-gradient-to-b from-[#0d0d14] via-[#11111a] to-[#171723] shadow-[0_0_50px_rgba(139,92,246,0.15)] overflow-hidden">
        <div className="px-6 pt-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-500/10 px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-yellow-300">
              Celerity Ventures
            </span>
          </div>
        </div>

        <div className="px-6 pt-5 pb-7 text-center">
          <p className="text-white/35 tracking-[0.35em] text-[11px] uppercase mb-3">
            Pending Transaction
          </p>

          <h2 className="text-white text-2xl font-semibold leading-tight mb-4">
            25,000 transaction is processing
          </h2>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 mb-4">
            <p className="text-[10px] text-white/40 uppercase tracking-[0.25em] mb-2">
              Destination wallet
            </p>
            <p className="text-sm text-purple-300 break-all font-medium">
              8wNtA7P4RWWe76WfnTocj59R7wRUg7zLsJuDmnRZLWot
            </p>
          </div>

          <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-500/10 via-fuchsia-500/10 to-purple-500/10 px-4 py-4 mb-4">
            <p className="text-[11px] uppercase tracking-[0.3em] text-white/35 mb-2">
              Countdown
            </p>
            <p className="text-3xl font-bold text-white tabular-nums">{countdown}</p>
          </div>

          <p className="text-sm text-white/60 leading-6">
            This is a pending transaction waiting for confirmation on the blockchain.          </p>
        </div>
      </div>
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

  // TEST OVERLAY STATE
  const [showMockOverlay, setShowMockOverlay] = useState(false)
  const [mockSecondsLeft, setMockSecondsLeft] = useState(24 * 60 * 60)

  const { balance, transactions, setTransactions, setBalance } = useWallet()

  // ---------------- FIREBASE (FIX DEPOSIT) ----------------
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      const data = docSnap.data()
      if (!data) return

      setBalance((prev) => {
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
              status: "completed",
            }

            updatedTxs = [depositTx, ...updatedTxs]
          }
        }

        setTransactions(updatedTxs)
        return newBalance
      })
    })

    return () => unsub()
  }, [user.uid, setBalance, setTransactions])

  // ---------------- LOAD TIMERS ----------------
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("withdrawTimers") || "{}")
    setTimerMap(saved)

    const isOpen = localStorage.getItem("mockProcessingOpen")
    const endTime = localStorage.getItem("mockEndTime")

    if (isOpen === "true" && endTime) {
      const remaining = Math.floor((Number(endTime) - Date.now()) / 1000)

      if (remaining > 0) {
        setMockSecondsLeft(remaining)
        setShowMockOverlay(true)
      } else {
        localStorage.setItem("mockProcessingOpen", "false")
        localStorage.removeItem("mockEndTime")
      }
    }
  }, [])

  // ---------------- COUNTDOWN TRANSACTIONS ----------------
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerMap((prev) => {
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

  // ---------------- MOCK OVERLAY COUNTDOWN REAL TIME ----------------
  useEffect(() => {
    if (!showMockOverlay) return

    const interval = setInterval(() => {
      const endTime = localStorage.getItem("mockEndTime")
      if (!endTime) return

      const remaining = Math.floor((Number(endTime) - Date.now()) / 1000)

      if (remaining <= 0) {
        clearInterval(interval)
        setMockSecondsLeft(0)
        setShowMockOverlay(false)
        localStorage.setItem("mockProcessingOpen", "false")
        localStorage.removeItem("mockEndTime")
        return
      }

      setMockSecondsLeft(remaining)
    }, 1000)

    return () => clearInterval(interval)
  }, [showMockOverlay])

  // ---------------- EXPIRE ----------------
  useEffect(() => {
    Object.entries(timerMap).forEach(([id, t]) => {
      if (t <= 0) {
        setTransactions((prevTxs) =>
          prevTxs.map((tx) => {
            if (tx.id === id && tx.status === "pending") {
              setBalance((prev) => prev + tx.amount)
              return { ...tx, status: "canceled" }
            }
            return tx
          })
        )

        setTimerMap((prev) => {
          const copy = { ...prev }
          delete copy[id]
          localStorage.setItem("withdrawTimers", JSON.stringify(copy))
          return copy
        })
      }
    })
  }, [timerMap, setBalance, setTransactions])

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
      status: "pending",
    }

    const newTxs = [tx, ...transactions]

    setTransactions(newTxs)
    setBalance((prev) => prev - amount)

    await updateDoc(doc(db, "users", user.uid), {
      transactions: newTxs,
      balance: balance - amount,
    })

    const newTimers = {
      ...timerMap,
      [tx.id]: 900,
    }

    setTimerMap(newTimers)
    localStorage.setItem("withdrawTimers", JSON.stringify(newTimers))

    window.location.href = "/solana"
  }

  // TEST ACTION
  const startMockOverlay = () => {
    const endTime = Date.now() + 24 * 60 * 60 * 1000

    localStorage.setItem("mockEndTime", String(endTime))
    localStorage.setItem("mockProcessingOpen", "true")

    setMockSecondsLeft(24 * 60 * 60)
    setShowMockOverlay(true)
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
        <div className="text-center relative z-50">
          <p className="text-white/30 tracking-[0.35em] text-xs uppercase mb-1">
            Total Balance
          </p>
          <Balance value={balance} />
        </div>

        <div className="w-full max-w-md">
          <Actions
            onDeposit={() => setShowDepositOptions(true)}
            onWithdraw={() => setShowWithdraw(true)}
          />
        </div>

        <div className="w-full max-w-md">
          <button
            onClick={startMockOverlay}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-purple-500 to-fuchsia-500 text-black font-semibold shadow-lg"
          >
            Pending Transaction Running 
          </button>
        </div>

        <div className="w-full max-w-md">
          <Card />
        </div>

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

            <div className="flex justify-center mb-4">
              <div className="bg-white p-3 rounded-xl shadow-2xl">
                <QRCodeSVG
                  value="Hc6WiKs82cystWP2hVFzUJaBw1hebVX7sncCpL4ab1fR"
                  size={160}
                />
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center mb-3">
              <p className="text-xs text-white/40 mb-1 tracking-widest uppercase">
                Wallet Address
              </p>

              <p className="text-white/80 text-xs break-all">
                Hc6WiKs82cystWP2hVFzUJaBw1hebVX7sncCpL4ab1fR
              </p>
            </div>

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

      {showWithdraw && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowWithdraw(false)}
          />
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

            {errorMsg && <div className="mt-3 text-red-400 text-sm text-center">{errorMsg}</div>}
          </div>
        </div>
      )}

      <MockProcessingOverlay open={showMockOverlay} secondsLeft={mockSecondsLeft} />
    </div>
  )
}