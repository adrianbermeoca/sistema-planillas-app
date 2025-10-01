'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

interface UserProfile {
  rol: 'Coordinador' | 'Supervisor' | 'Gerente'
  nombre_completo: string | null
}

export default function UserInfo() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUserAndProfile = async () => {
      try {
        // Get authenticated user
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

        if (user) {
          // Fetch user profile with role
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('rol, nombre_completo')
            .eq('id', user.id)
            .single()

          if (error) {
            console.error('Error fetching profile:', error)
          } else {
            setProfile(profileData)
          }
        }
      } catch (error) {
        console.error('Error in getUserAndProfile:', error)
      } finally {
        setIsLoading(false)
      }
    }

    getUserAndProfile()
  }, [supabase])

  if (isLoading) {
    return (
      <div className="px-3 py-2 text-sm text-gray-500">
        Cargando...
      </div>
    )
  }

  if (!user) {
    return (
      <div className="px-3 py-2 text-sm text-gray-500">
        No autenticado
      </div>
    )
  }

  // Get display name (prefer nombre_completo, fallback to email)
  const displayName = profile?.nombre_completo || user.email

  // Get initial for avatar
  const initial = profile?.nombre_completo
    ? profile.nombre_completo.charAt(0).toUpperCase()
    : user.email?.charAt(0).toUpperCase() || 'U'

  // Get role display (fallback to Supervisor if not found)
  const roleDisplay = profile?.rol || 'Supervisor'

  return (
    <div className="px-3 py-2 border-t border-gray-200">
      <div className="flex items-center">
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
          {initial}
        </div>
        <div className="ml-3 flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate" title={displayName}>
            {displayName}
          </p>
          <p className="text-xs text-gray-500">
            {roleDisplay}
          </p>
        </div>
      </div>
    </div>
  )
}
