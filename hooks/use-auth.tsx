"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export interface User {
  user_id: string
  email: string
  first_name: string
  last_name: string
  role: "user" | "admin"
  email_verified: boolean
  created_at: string
  // Commerce fields — populated via the customers table JOIN in /api/auth/session
  customer_id: string | null
  total_orders: number
  total_spent: number
  last_order_date: string | null
}

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  })
  const router = useRouter()

  // Check session on mount
  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const response = await fetch("/api/auth/session", {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setState({ user: data.user, loading: false, error: null })
      } else {
        setState({ user: null, loading: false, error: null })
      }
    } catch {
      setState({ user: null, loading: false, error: "Session check failed" })
    }
  }

  const login = async (email: string, password: string, rememberMe = false) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, rememberMe }),
      })

      const data = await response.json()

      if (response.ok) {
        setState({ user: data.user, loading: false, error: null })
        return { success: true, user: data.user }
      } else {
        setState((prev) => ({ ...prev, loading: false, error: data.error }))
        return { success: false, error: data.error }
      }
    } catch {
      const errorMessage = "Login failed. Please try again."
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }))
      return { success: false, error: errorMessage }
    }
  }

  const register = async (userData: {
    email: string
    password: string
    firstName: string
    lastName: string
  }) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (response.ok) {
        setState((prev) => ({ ...prev, loading: false, error: null }))
        return { success: true, message: data.message }
      } else {
        setState((prev) => ({ ...prev, loading: false, error: data.error }))
        return { success: false, error: data.error }
      }
    } catch (error) {
      const errorMessage = "Registration failed. Please try again."
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }))
      return { success: false, error: errorMessage }
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
      setState({ user: null, loading: false, error: null })
      router.push("/auth/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const forgotPassword = async (email: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      setState((prev) => ({ ...prev, loading: false }))

      return {
        success: response.ok,
        message: data.message || data.error,
      }
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error: "Request failed" }))
      return { success: false, message: "Request failed. Please try again." }
    }
  }

  const resetPassword = async (token: string, newPassword: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: newPassword }),
      })

      const data = await response.json()

      if (response.ok) {
        setState((prev) => ({ ...prev, loading: false, error: null }))
        return { success: true, message: data.message }
      } else {
        setState((prev) => ({ ...prev, loading: false, error: data.error }))
        return { success: false, error: data.error }
      }
    } catch (error) {
      const errorMessage = "Password reset failed. Please try again."
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }))
      return { success: false, error: errorMessage }
    }
  }

  const validateResetToken = async (token: string) => {
    try {
      const response = await fetch(`/api/auth/reset-password/validate?token=${encodeURIComponent(token)}`)
      if (response.ok) {
        const data = await response.json()
        return { valid: data.valid, email: data.email }
      } else {
        const data = await response.json()
        return { valid: false, error: data.error || "Invalid token" }
      }
    } catch {
      return { valid: false, error: "Failed to validate token" }
    }
  }

  return {
    ...state,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    validateResetToken,
    checkSession,
    isAuthenticated: !!state.user,
    isAdmin: state.user?.role === "admin",
  }
}
