'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      setIsLoggingOut(false)
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg
        className="w-5 h-5 mr-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
        />
      </svg>
      {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}
    </button>
  )
}
