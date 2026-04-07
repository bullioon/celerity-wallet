"use client"

export default function Actions({
  onDeposit,
  onWithdraw,
}: {
  onDeposit: () => void
  onWithdraw: () => void
}) {
  return (
    <div className="flex gap-3">
      
      <button
        onClick={onDeposit}
        className="
          flex-1
          py-3
          rounded-xl
          bg-white/5
          text-white
          border border-white/10
          hover:bg-white/10
          transition
        "
      >
        Deposit
      </button>

      <button
        onClick={onWithdraw}
        className="
          flex-1
          py-3
          rounded-xl
          bg-white/5
          text-white
          border border-white/10
          hover:bg-white/10
          transition
        "
      >
        Withdraw
      </button>

    </div>
  )
}