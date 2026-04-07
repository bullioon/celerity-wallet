"use client"

import { useState } from "react"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from "chart.js"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

interface Wallet {
  symbol: string
  balance: number
  fiatRate: number // para mostrar equivalente en USD
}

interface Transaction {
  id: number
  symbol: string
  type: "Deposit" | "Withdraw"
  amount: number
  date: string
}

export default function WalletDashboard() {
  const [wallets, setWallets] = useState<Wallet[]>([
    { symbol: "BTC", balance: 0.12, fiatRate: 25000 },
    { symbol: "USDT", balance: 1250, fiatRate: 1 },
    { symbol: "SOL", balance: 10, fiatRate: 20 },
  ])

  const [history, setHistory] = useState<Transaction[]>([
    { id: 1, symbol: "BTC", type: "Deposit", amount: 0.05, date: "2026-03-30" },
    { id: 2, symbol: "USDT", type: "Withdraw", amount: 300, date: "2026-03-29" },
  ])

  const handleDeposit = (symbol: string) => {
    const amount = prompt(`Deposit amount for ${symbol}`)
    if (!amount) return
    const amt = parseFloat(amount)
    setWallets(wallets.map(w => w.symbol === symbol ? { ...w, balance: w.balance + amt } : w))
    setHistory([{ id: Date.now(), symbol, type: "Deposit", amount: amt, date: new Date().toISOString() }, ...history])
  }

  const handleWithdraw = (symbol: string) => {
    const amount = prompt(`Withdraw amount for ${symbol}`)
    if (!amount) return
    const amt = parseFloat(amount)
    setWallets(wallets.map(w => w.symbol === symbol ? { ...w, balance: w.balance - amt } : w))
    setHistory([{ id: Date.now(), symbol, type: "Withdraw", amount: amt, date: new Date().toISOString() }, ...history])
  }

  const totalBalanceUSD = wallets.reduce((acc, w) => acc + w.balance * w.fiatRate, 0)

  const chartData = {
    labels: ["Mar 26", "Mar 27", "Mar 28", "Mar 29", "Mar 30"],
    datasets: [
      {
        label: "Balance",
        data: [10000, 10500, 10300, 11000, totalBalanceUSD],
        borderColor: "#fff",
        backgroundColor: "rgba(255,255,255,0.1)",
        tension: 0.3,
      }
    ]
  }

  return (
    <main className="min-h-screen bg-black text-white font-sans px-6 py-6 flex flex-col gap-6">

      {/* HEADER: Total Balance */}
      <section className="text-center">
        <p className="text-gray-400 text-sm">Total Balance</p>
        <h1 className="text-5xl font-bold">${totalBalanceUSD.toLocaleString()}</h1>
        <p className="text-green-400 text-sm mt-1">+5% vs yesterday</p>
      </section>

      {/* Mini Graph */}
      <section className="mt-4 bg-white/5 rounded-2xl p-4">
        <Line 
          data={chartData} 
          options={{ 
            responsive: true, 
            plugins: { legend: { display: false } }, 
            scales: { 
              x: { ticks: { color: "#aaa" } }, 
              y: { ticks: { color: "#aaa" } } 
            } 
          }} 
        />
      </section>

      {/* Wallets Section */}
      <section className="mt-6 space-y-4">
        {wallets.map(w => (
          <div key={w.symbol} className="bg-white/5 rounded-2xl p-4 flex justify-between items-center">
            <div>
              <p className="text-gray-400 text-sm">{w.symbol}</p>
              <h2 className="text-xl font-semibold">{w.balance} {w.symbol} (~${(w.balance*w.fiatRate).toLocaleString()})</h2>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleDeposit(w.symbol)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm">Deposit</button>
              <button onClick={() => handleWithdraw(w.symbol)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm">Withdraw</button>
            </div>
          </div>
        ))}
      </section>

      {/* Mastercard */}
      <section className="mt-6">
        <div className="bg-white/5 rounded-2xl p-4 flex justify-between items-center">
          <div>
            <p className="text-gray-400 text-sm">Mastercard</p>
            <h2 className="font-semibold">**** **** **** 1234</h2>
          </div>
          <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm">Manage</button>
        </div>
      </section>

      {/* Transaction History */}
      <section className="mt-6 space-y-2">
        <p className="text-gray-400 text-sm">Recent Transactions</p>
        {history.length === 0 && <p className="text-gray-500 text-sm">No transactions yet.</p>}
        {history.map(tx => (
          <div key={tx.id} className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
            <div>
              <p className="text-sm">{tx.type} {tx.amount} {tx.symbol}</p>
            </div>
            <p className="text-gray-400 text-xs">{tx.date.slice(0,10)}</p>
          </div>
        ))}
      </section>

    </main>
  )
}