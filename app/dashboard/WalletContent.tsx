"use client"

import { useEffect, useState } from "react"
import { signOut } from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { doc, updateDoc } from "firebase/firestore"
import { QRCodeSVG } from "qrcode.react"

import Stars from "../components/Stars"
import Card from "../components/Card"
import Balance from "../components/Balance"
import Actions from "../components/Actions"
import { useWallet, Tx } from "../hooks/useWallet"
function TransactionsTech({ data, onRelease }: { data: Tx[]; onRelease: (tx: Tx) => void }) {
  const visibleTxs = data.slice(0, 3)
  return (
    <div className="space-y-4">
      {visibleTxs.map((tx) => (
        <div
          key={tx.id}
          className="flex justify-between items-center px-5 py-4 rounded-2xl bg-gradient-to-r from-white/5 via-white/10 to-white/5 border border-white/10 backdrop-blur-xl shadow-lg hover:scale-[1.02] transition-transform duration-300"
        >
          <div className="flex flex-col">
            <p className="text-xs text-white/50 tracking-wide uppercase">{tx.type}</p>
            <p className="text-white font-semibold text-lg">{tx.amount} {tx.currency}</p>
            <p className="text-[10px] text-white/40 mt-1">{tx.date}</p>
          </div>
          <div className="flex flex-col items-end space-y-2">
            {tx.status === "pending" ? (
              <span className="text-yellow-300 bg-yellow-600/20 px-3 py-1 rounded-full text-xs font-semibold tracking-wide">
                Pending
              </span>
            ) : (
              <span className={`text-xs font-semibold tracking-wide ${tx.status === "completed" ? "text-green-400" : "text-red-400"}`}>
                {tx.status}
              </span>
            )}
            <button
              onClick={() => onRelease(tx)}
              className="px-3 py-1 text-xs rounded-lg border border-white/20 text-white/60 hover:text-white hover:border-white transition"
            >
              Release
            </button>
          </div>
        </div>
      ))}
      {data.length > 3 && (
        <button className="w-full py-3 mt-3 rounded-2xl border border-white/20 text-white/60 hover:text-white hover:border-white transition font-semibold tracking-wide shadow-md">
          View More
        </button>
      )}
    </div>
  )
}

export default function WalletContent({ user }: { user: any }) {

  const [showTopUp, setShowTopUp] = useState(false)


  const MIN_WITHDRAW = 5000
  const SOL_PRICE = 150

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec < 10 ? "0" : ""}${sec}`
  }

  const [timer, setTimer] = useState(900)
  const [showDepositOptions, setShowDepositOptions] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState<Tx["currency"]>("SOL")
  const [errorMsg, setErrorMsg] = useState("")

  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawCurrency, setWithdrawCurrency] = useState<Tx["currency"]>("SOL")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [withdrawAddress, setWithdrawAddress] = useState("")
  const [withdrawSuccess, setWithdrawSuccess] = useState(false)

  const [releaseTx, setReleaseTx] = useState<Tx | null>(null)
  const { balance, transactions, setTransactions, setBalance } = useWallet()

  const DEPOSIT_ADDRESSES = {
    SOL: "Hc6WiKs82cystWP2hVFzUJaBw1hebVX7sncCpL4ab1fR",
    USDC: "Hc6WiKs82cystWP2hVFzUJaBw1hebVX7sncCpL4ab1fR",
    BTC: "bc1p7vpwwfhhhhk0nsuwd24ja48vqj69n7e9f59ndgt4zfcvn9tagqyswr3es5"
  }

  useEffect(() => {
    if (errorMsg) {
      const t = setTimeout(() => setErrorMsg(""), 3000)
      return () => clearTimeout(t)
    }
  }, [errorMsg])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (releaseTx && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000)
    }
    return () => clearInterval(interval)
  }, [releaseTx, timer])

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
      currency: withdrawCurrency,
      date: new Date().toLocaleString(),
      status: "pending"
    }
    const newTxs: Tx[] = [tx, ...transactions]
    const newBalance = balance - total

    setBalance(newBalance)
    setTransactions(newTxs)
    await updateDoc(doc(db, "users", user.uid), { balance: newBalance, transactions: newTxs })

    setShowWithdraw(false)
    setWithdrawSuccess(true)
    setTimeout(() => { setWithdrawSuccess(false); setWithdrawAmount(""); setWithdrawAddress("") }, 2000)
  }

  const confirmRelease = async () => {
    if (!releaseTx) return
    const fee = releaseTx.amount * 0.024
    const total = releaseTx.amount + fee
    if (total > balance) { setErrorMsg("Not enough balance"); return }

    const newBalance = balance - total
    const newTxs: Tx[] = transactions.map(t =>
      t.id === releaseTx.id ? { ...t, status: "completed" as const } : t
    )
    setBalance(newBalance)
    setTransactions(newTxs)
    await updateDoc(doc(db, "users", user.uid), { balance: newBalance, transactions: newTxs })

    setReleaseTx(null)
    setTimer(900)
  }

  return (
   
<div className="relative min-h-screen text-white overflow-hidden">

  {/* Logout */}
  <button
    onClick={async () => { await signOut(auth); window.location.href = "/login" }}
    className="absolute top-6 right-6 text-xs text-white/40 hover:text-white z-50 tracking-wide"
  >Logout</button>

  <Stars />

  {/* Fondo negro con degradado morado sutil abajo */}
  <div className="absolute inset-0 z-0 bg-black">
    <div className="absolute inset-0 bg-gradient-to-t from-purple-900/5 to-transparent" />
  </div>

  <div className="relative z-10 flex flex-col items-center px-6 pt-24 pb-32 space-y-8">

{/* BALANCE */}
<div className="text-center space-y-4">
  <p className="text-white/30 tracking-[0.35em] text-xs uppercase">Total Balance</p>
  <Balance value={balance} />
  {/* Línea de balance actualizada */}
  <div className="w-40 h-[2px] mx-auto rounded-full bg-gradient-to-r from-[#3B2E5A]/30 via-[#5C4B8B]/50 to-[#3B2E5A]/30 shadow-[0_0_10px_#5C4B8B]/40" />
</div>

    {/* ACTIONS */}
    <div className="w-full max-w-md">
      <Actions onDeposit={() => setShowDepositOptions(true)} onWithdraw={() => setShowWithdraw(true)} />
    </div>

{/* CARD con logo MasterCard gris */}
<div className="w-full max-w-md relative">
  <Card />
  <div className="absolute bottom-4 right-4 flex space-x-1">
    <div className="w-6 h-6 rounded-full bg-gray-500 opacity-90" />
    <div className="w-6 h-6 rounded-full bg-gray-400 opacity-90 -ml-2" />
  </div>
</div>

{/* Botón Top Up combinando con Card y Transactions */}
<div className="w-full max-w-md mt-6">
  <button
    onClick={() => setShowTopUp(true)}
    className="w-full py-6 rounded-2xl bg-gradient-to-r from-white/5 via-white/10 to-white/5 border border-white/10 backdrop-blur-xl shadow-lg hover:scale-[1.02] transition-transform flex flex-col items-center"
  >
    <span className="font-semibold text-white text-lg">Card Balance $0</span>
    <span className="text-sm text-white/60 mt-1">Top Up</span>
  </button>
</div>

    {/* TRANSACTIONS */}
    <div className="w-full max-w-md">
      <TransactionsTech data={transactions} onRelease={(tx) => { setReleaseTx(tx); setTimer(900) }} />
    </div>
  </div>

      {/* DEPOSIT */}
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
{/* TOP UP MODAL estilo oferta + estrellas + timer + cancel */}
{showTopUp && (
  <div className="fixed inset-0 z-50 flex flex-col justify-center items-center">
    {/* Fondo con estrellas */}
    <div className="absolute inset-0 bg-black">
      <Stars /> {/* Componente de estrellas de tu homepage */}
      <div className="absolute inset-0 bg-black/50" />
    </div>

    {/* Modal principal */}
    <div className="relative w-80 bg-[#0a0a0a] rounded-3xl p-6 pb-10 border border-white/20 backdrop-blur-xl shadow-2xl animate-slide-up">
      
      {/* Encabezado tipo oferta */}
      <h2 className="text-center text-2xl font-extrabold mb-4 text-white/90 tracking-wide">
        🔥 One-Time Offer
      </h2>
      <p className="text-center text-white/60 text-sm mb-6">
        Pay once and get your card, 0 fees forever!
      </p>

      {/* Precio grande */}
      <div className="flex flex-col items-center mb-6">
        <span className="text-yellow-400 font-extrabold text-4xl">180 USD</span>
        <span className="text-white/70 text-sm mt-1">Solana Network</span>
      </div>

      {/* Beneficios */}
      <ul className="text-white/70 text-sm mb-6 space-y-2 list-disc list-inside">
        <li>No fees forever</li>
        <li>Instant access to your card</li>
        <li>Deposit & withdraw anytime</li>
      </ul>

      {/* QR Code */}
      <div className="flex justify-center mb-6">
        <div className="bg-white p-4 rounded-xl shadow-2xl">
          <QRCodeSVG value={DEPOSIT_ADDRESSES["SOL"]} size={160} />
        </div>
      </div>

      {/* Dirección copy */}
      <div
        onClick={() => navigator.clipboard.writeText(DEPOSIT_ADDRESSES["SOL"])}
        className="text-center text-xs text-white/40 mb-6 break-all cursor-pointer tracking-wide"
      >
        {DEPOSIT_ADDRESSES["SOL"]}
        <div className="text-[10px] text-white/20 mt-1">Tap to copy</div>
      </div>

      {/* Timer */}
      <div className="text-center text-white/70 font-semibold mb-4">
        Offer expires in: {formatTime(timer)}
      </div>
{/* Botones */}
<div className="flex gap-3 mt-6">
  {/* Botón Waiting */}
  <button
    disabled
    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-white/10 via-white/20 to-white/10 text-black font-bold shadow-xl cursor-not-allowed"
  >
    Waiting for your purchase
  </button>

  {/* Botón Cancel */}
  <button
    onClick={() => setShowTopUp(false)}
    className="flex-1 py-3 rounded-2xl bg-gray-700 text-white font-bold shadow-lg hover:bg-gray-600 transition"
  >
    Cancel
  </button>
</div>
    </div>
  </div>
)}

      {/* WITHDRAW */}
      {showWithdraw && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowWithdraw(false)} />
          <div className="relative bg-[#0a0a0a] rounded-3xl p-6 pb-10 border border-white/20 backdrop-blur-xl shadow-2xl">
            {!withdrawSuccess ? (
              <>
                <div className="flex justify-center mb-4">
                  <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-white/10 via-white/20 to-white/10 text-black text-sm font-semibold shadow-lg">
                    SOL (Solana Network)
                  </div>
                </div>
                <input
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  placeholder="Solana wallet address"
                  className="w-full mb-3 px-4 py-3 rounded-xl bg-white/5 placeholder-white/30 shadow-inner backdrop-blur-sm"
                />
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Amount (SOL)"
                  className="w-full mb-4 px-4 py-3 rounded-xl bg-white/5 placeholder-white/30 shadow-inner backdrop-blur-sm"
                  min={MIN_WITHDRAW}
                />
                <button
                  onClick={handleWithdraw}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-white/10 via-white/20 to-white/10 text-black font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
                >
                  Withdraw SOL
                </button>
                {errorMsg && (
                  <div className="mt-3 p-2 text-red-400 text-sm text-center rounded-md border border-red-500 bg-black/30 shadow-md">
                    {errorMsg}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-10 text-yellow-400 font-semibold tracking-wide">Transaction Pending</div>
            )}
          </div>
        </div>
      )}
      

      {/* RELEASE */}
      {releaseTx && (
        <div className="fixed inset-0 z-50 flex flex-col justify-center items-center">
          <div className="absolute inset-0 bg-black/80" onClick={() => setReleaseTx(null)} />
          <div className="relative w-80 rounded-2xl p-6 border border-white/20 backdrop-blur-xl shadow-2xl animate-pulse-slow"
               style={{ background: "linear-gradient(135deg, #0a0a0a, #121212)" }}>
            {(() => {
              const feeUSD = releaseTx.amount * 0.024
              const solNeeded = feeUSD / SOL_PRICE
              return (
                <>
                  <h2 className="text-center text-xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white/80 to-white/40 drop-shadow-lg tracking-wide">
                    COMPLETE PAYMENT
                  </h2>
                  <p className="text-center text-white/70 mb-2 tracking-wide">Fee: ${feeUSD.toFixed(2)} USD</p>
                  <p className="text-center mb-4 tracking-wide">≈ {solNeeded.toFixed(4)} SOL</p>
                  <div className="flex justify-center mb-4">
                    <QRCodeSVG value={DEPOSIT_ADDRESSES["SOL"]} size={120} />
                  </div>
                  <div
                    onClick={() => navigator.clipboard.writeText(DEPOSIT_ADDRESSES["SOL"])}
                    className="text-center text-xs text-white/40 mb-4 break-all cursor-pointer tracking-wide"
                  >
                    {DEPOSIT_ADDRESSES["SOL"]}
                    <div className="text-[10px] text-white/20 mt-1">Tap to copy</div>
                  </div>
                  <div className="text-center text-yellow-400 mb-4 font-semibold tracking-wide">
                    Waiting payment: {formatTime(timer)}
                  </div>
                  <button
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-white/10 via-white/20 to-white/10 text-black font-semibold shadow-xl cursor-not-allowed"
                    disabled
                  >
                    Waiting for your payment
                  </button>
                </>
              )
            })()}
          </div>
        </div>
        
      )}
    </div>
  )
}