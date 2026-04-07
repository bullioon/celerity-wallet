"use client"

import { useState } from "react"
import { auth, db } from "@/lib/firebase"; // o la ruta correcta según tu proyecto
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleAuth = async () => {
    setError("")

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        const res = await createUserWithEmailAndPassword(auth, email, password)

        await setDoc(doc(db, "users", res.user.uid), {
          balance: 0,
          transactions: []
        })
      }

      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center px-6">

      {/* LOGO / TITLE */}
      <h1 className="text-2xl tracking-widest mb-8 text-white/80">
        Celerity
      </h1>

      {/* CARD */}
      <div className="w-full max-w-sm bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-3xl p-6 space-y-4">

        <h2 className="text-center text-lg text-white/80">
          {isLogin ? "Login" : "Create Account"}
        </h2>

        {/* ERROR */}
        {error && (
          <div className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 py-2 rounded-xl">
            {error}
          </div>
        )}

        {/* EMAIL */}
        <input
          type="email"
          placeholder="Email"
          onChange={e => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 focus:outline-none"
        />

        {/* PASSWORD */}
        <input
          type="password"
          placeholder="Password"
          onChange={e => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 focus:outline-none"
        />

        {/* BUTTON */}
        <button
          onClick={handleAuth}
          className="w-full py-3 rounded-2xl bg-white text-black font-semibold hover:opacity-90 transition"
        >
          {isLogin ? "Login" : "Create Account"}
        </button>

        {/* SWITCH */}
        <p
          onClick={() => setIsLogin(!isLogin)}
          className="text-center text-sm text-white/40 cursor-pointer hover:text-white"
        >
          {isLogin
            ? "Don't have an account? Register"
            : "Already have an account? Login"}
        </p>

      </div>

    </div>
  )
}