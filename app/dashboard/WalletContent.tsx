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
                  Pending {remainingTime > 0 ? `- ${Math.floor(remainingTime / 60)}:${(remainingTime % 60).toString().padStart(2,"0")}` : "- Canceled"}
                </span>
              ) : (
                <span className={`text-xs font-semibold tracking-wide ${tx.status === "completed" ? "text-green-400 bg-green-800/20 px-3 py-1 rounded-full" : "text-red-400"}`}>
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

      {data.length > 3 && (
        <button className="w-full py-3 mt-3 rounded-2xl border border-white/20 text-white/60 hover:text-white hover:border-white transition font-semibold tracking-wide shadow-md">
          View More
        </button>
      )}
    </div>
  )
}

// ---------------- WALLET CONTENT ----------------
export default function WalletContent({ user }: { user: any }) {
  const MIN_WITHDRAW = 4009
  const SOL_PRICE = 150
  const TOPUP_PRICE = 180

  const [timerMap, setTimerMap] = useState<Record<string, number>>({})
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [withdrawAddress, setWithdrawAddress] = useState("")
  const [withdrawSuccess, setWithdrawSuccess] = useState(false)
  const [releaseTx, setReleaseTx] = useState<Tx | null>(null)
  const [errorMsg, setErrorMsg] = useState("")
  const [showDepositOptions, setShowDepositOptions] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState<Tx["currency"]>("SOL")
  const [showTopUp, setShowTopUp] = useState(false)

  const { balance, transactions, setTransactions, setBalance } = useWallet()

  const DEPOSIT_ADDRESSES = {
    SOL: "Hc6WiKs82cystWP2hVFzUJaBw1hebVX7sncCpL4ab1fR",
    USDC: "Hc6WiKs82cystWP2hVFzUJaBw1hebVX7sncCpL4ab1fR",
    BTC: "bc1p7vpwwfhhhhk0nsuwd24ja48vqj69n7e9f59ndgt4zcvn9tagqyswr3es5"
  }

  // Firestore updates
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      const data = docSnap.data()
      if (data) {
        setBalance(prev => {
          const newBalance = data.balance
          if (newBalance > prev) {
            const depositTx: Tx = {
              id: crypto.randomUUID(),
              type: "deposit",
              amount: newBalance - prev,
              currency: "USDC",
              date: new Date().toLocaleString(),
              status: "completed"
            }
            setTransactions(prevTxs => [depositTx, ...prevTxs])
          }
          return newBalance
        })
        setTransactions(data.transactions)
        const savedTimers = JSON.parse(localStorage.getItem("withdrawTimers") || "{}")
        const newTimerMap: Record<string, number> = {}
        data.transactions.forEach((tx: Tx) => {
          if (tx.type === "withdraw" && tx.status === "pending") {
            newTimerMap[tx.id] = savedTimers[tx.id] ?? 900
          }
        })
        setTimerMap(newTimerMap)
      }
    })
    return () => unsub()
  }, [user.uid])

  // Countdown timers persistentes
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

  // Expire withdrawals
  useEffect(() => {
    Object.entries(timerMap).forEach(([id, t]) => {
      if (t <= 0) {
        setTransactions(prevTxs => prevTxs.map(tx => {
          if (tx.id === id && tx.status === "pending") {
            setBalance(prev => prev + tx.amount)
            return { ...tx, status: "canceled" } as Tx
          }
          return tx
        }))
        setTimerMap(prev => {
          const copy = { ...prev }
          delete copy[id]
          localStorage.setItem("withdrawTimers", JSON.stringify(copy))
          return copy
        })
      }
    })
  }, [timerMap])

    // ---------------- FUNCIONES ----------------
  const handleWithdraw = async () => {
    const amount = Number(withdrawAmount)
    if (!amount || !withdrawAddress) return
    if (amount < MIN_WITHDRAW) { setErrorMsg(`Minimum withdrawal is ${MIN_WITHDRAW}`); return }
    if (amount > balance) { setErrorMsg("Not enough balance"); return }

    const fee = amount * 0.024
    const total = amount + fee
    if (total > balance) { setErrorMsg(`Not enough balance to cover fee (${fee.toFixed(2)})`); return }

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
    setBalance(prev => prev - total)

    await updateDoc(doc(db, "users", user.uid), {
      transactions: newTxs,
      balance: balance - total
    })

    setWithdrawSuccess(true)
    setTimeout(() => {
      setWithdrawSuccess(false)
      setWithdrawAmount("")
      setWithdrawAddress("")
    }, 2000)
  }

  const confirmRelease = async () => {
    if (!releaseTx) return
    const newTxs: Tx[] = transactions.map(t =>
      t.id === releaseTx.id ? { ...t, status: "completed" } : t
    )
    setTransactions(newTxs)
    await updateDoc(doc(db, "users", user.uid), { transactions: newTxs })
    setReleaseTx(null)
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2,"0")}`

  // ---------------- RENDER ----------------
  return (
    <div className="relative min-h-screen text-white overflow-hidden">
      <button
        onClick={async () => { await signOut(auth); window.location.href = "/login" }}
        className="absolute top-6 right-6 text-xs text-white/40 hover:text-white z-50 tracking-wide"
      >
        Logout
      </button>

      <Stars />

      <div className="absolute inset-0 z-0 bg-black">
        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/5 to-transparent" />
      </div>

      <div className="relative z-10 flex flex-col items-center px-6 pt-24 pb-32 space-y-8">
      
      
      
{/* BALANCE */}
<div className="text-center relative z-50">
  <p className="text-white/30 tracking-[0.35em] text-xs uppercase mb-1">Total Balance</p>
  <Balance value={balance} />

  {/* 🔹 Glow morado estilo Phantom Wallet */}
  <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 w-64 h-6 
                  bg-gradient-to-r from-purple-400/70 via-purple-500/50 to-purple-400/70 
                  rounded-full blur-3xl animate-pulse-slow pointer-events-none" />
</div>

        {/* ACTIONS */}
        <div className="w-full max-w-md">
          <Actions
            onDeposit={() => setShowDepositOptions(true)}
            onWithdraw={() => setShowWithdraw(true)}
          />
        </div>

        {/* CARD + TOP-UP */}
        <div className="w-full max-w-md relative flex flex-col items-center">
          <div className="relative w-full">
            <Card />
<div className="absolute top-4 right-4 w-12 h-12">
  <svg viewBox="0 0 120 80" className="w-full h-full">
    <circle cx="40" cy="40" r="30" fill="#EB001B" />
    <circle cx="80" cy="40" r="30" fill="#F79E1B" />
    <circle cx="60" cy="40" r="30" fill="#FF5F00" opacity="0.5"/>
  </svg>
</div>
          </div>

          <div className="w-full mt-4 relative text-center">
            <p className="text-white/30 uppercase tracking-widest text-xs mb-1">Card Balance</p>
            <p className="text-white font-extrabold text-3xl shadow-lg">
  $0
</p>
            <div className="absolute inset-x-0 bottom-0 h-3 bg-gradient-to-r from-purple-500/40 via-purple-400/30 to-purple-500/40 rounded-full blur-xl"></div>
          </div>

          <button
            onClick={() => setShowTopUp(true)}
            className="mt-4 w-full py-3 rounded-2xl bg-gradient-to-r from-purple-700 via-purple-600 to-purple-700 text-white font-semibold shadow-lg hover:shadow-2xl transition-all duration-300"
          >
            Top Up
          </button>
        </div>

        {/* TRANSACTIONS */}
        <TransactionsTech
          data={transactions}
          onRelease={(tx: Tx) => setReleaseTx(tx)}
          solPrice={SOL_PRICE}
          timerMap={timerMap}
        />
      </div>

      {/* MODALES */}
      {showDepositOptions && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowDepositOptions(false)} />
          <div className="relative bg-[#0a0a0a] rounded-3xl p-6 pb-10 border border-white/20 backdrop-blur-xl shadow-2xl">
            <h2 className="text-center text-lg mb-4 font-extrabold text-white/80 tracking-wide">Deposit</h2>
            <div className="flex gap-2 justify-center mb-4">
              {(["SOL","BTC","USDC"] as const).map(cur => (
                <button
                  key={cur}
                  onClick={() => setSelectedCurrency(cur)}
                  className={`px-3 py-1 rounded-lg text-sm border border-white/20 ${selectedCurrency === cur ? "bg-gradient-to-r from-white/20 via-white/30 to-white/20 text-black font-semibold shadow-md" : "text-white/60"}`}
                >
                  {cur}
                </button>
              ))}
            </div>
            <div className="flex justify-center mb-4">
              <div className="bg-white p-3 rounded-xl shadow-2xl">
                <QRCodeSVG value={DEPOSIT_ADDRESSES[selectedCurrency]} size={160} />
              </div>
            </div>
            <p className="text-center text-xs text-white/40 break-all">{DEPOSIT_ADDRESSES[selectedCurrency]}</p>
          </div>
        </div>
      )}

      {showTopUp && (
        <div className="fixed inset-0 z-50 flex flex-col justify-center items-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowTopUp(false)} />
          <div className="relative w-80 rounded-3xl p-6 border border-white/20 backdrop-blur-xl shadow-2xl">
            <h2 className="text-center text-xl font-extrabold mb-4 text-white/80 tracking-wide">
              Lifetime Plan
            </h2>
            <p className="text-center mb-4 text-white/70">Pay ${TOPUP_PRICE} via Solana</p>
            <div className="flex justify-center mb-4">
              <QRCodeSVG value={DEPOSIT_ADDRESSES.SOL} size={140} />
            </div>
            <button className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 text-black font-semibold shadow-lg">
              Pay Now
            </button>
          </div>
        </div>
      )}

      {showWithdraw && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowWithdraw(false)} />
          <div className="relative bg-[#1a1a1a] rounded-3xl p-6 pb-10 border border-white/20 backdrop-blur-xl shadow-2xl">
            {!withdrawSuccess ? (
              <>
                <div className="flex justify-center mb-4">
                  <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 via-purple-600 to-purple-500 text-black text-sm font-semibold shadow-lg">
                    SOL (Solana Network)
                  </div>
                </div>
                <input
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  placeholder="Wallet address"
                  className="w-full mb-3 px-4 py-3 rounded-xl bg-white/5 placeholder-white/30 shadow-inner backdrop-blur-sm"
                />
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder={`Amount (USD) min ${MIN_WITHDRAW}`}
                  className="w-full mb-4 px-4 py-3 rounded-xl bg-white/5 placeholder-white/30 shadow-inner backdrop-blur-sm"
                  min={MIN_WITHDRAW}
                />
                <button
                  onClick={handleWithdraw}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 text-black font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
                >
                  Withdraw
                </button>
                {errorMsg && <div className="mt-3 p-2 text-red-400 text-sm text-center rounded-md border border-red-500 bg-black/30 shadow-md">{errorMsg}</div>}
              </>
            ) : (
              <div className="text-center py-10 text-yellow-400 font-semibold tracking-wide">Transaction Pending</div>
            )}
          </div>
        </div>
      )}

      {releaseTx && (
        <div className="fixed inset-0 z-50 flex flex-col justify-center items-center">
          <div className="absolute inset-0 bg-black/80" onClick={() => setReleaseTx(null)} />
          <div className="relative w-80 rounded-2xl p-6 border border-white/20 backdrop-blur-xl shadow-2xl animate-pulse-slow">
            <h2 className="text-center text-xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white/80 to-white/40 drop-shadow-lg tracking-wide">
              COMPLETE PAYMENT
            </h2>
            <p className="text-center text-white/70 mb-2 tracking-wide">Fee: ${(releaseTx.amount * 0.024).toFixed(2)} USD</p>
            <p className="text-center mb-4 tracking-wide">≈ {(releaseTx.amount * 0.024 / SOL_PRICE).toFixed(4)} SOL</p>
            <div className="flex justify-center mb-4">
              <QRCodeSVG value={DEPOSIT_ADDRESSES["SOL"]} size={120} />
            </div>
            <div className="text-center text-yellow-400 mb-4 font-semibold tracking-wide">
              Waiting payment: {formatTime(timerMap[releaseTx.id] ?? 900)}
            </div>
            <button className="w-full py-3 rounded-2xl bg-gradient-to-r from-white/10 via-white/20 to-white/10 text-black font-semibold shadow-xl cursor-not-allowed" disabled>
              Waiting for your payment
            </button>
          </div>
        </div>
      )}
    </div>
  )
}