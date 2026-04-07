"use client"

import WalletContent from "./WalletContent" // default import, coincide con export default
import { useAuth } from "../hooks/useAuth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function WalletPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading])

  if (loading || !user) return null

  return <WalletContent user={user} /> // ✅ ahora sí funciona
}