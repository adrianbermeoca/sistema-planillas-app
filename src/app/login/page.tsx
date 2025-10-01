'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Sistema de Planillas
            </h1>
            <p className="text-gray-600">
              Gestión Agraria - Ley N° 31110
            </p>
          </div>

          {/* Auth UI Component */}
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#2563eb',
                    brandAccent: '#1d4ed8',
                  },
                },
              },
              className: {
                container: 'auth-container',
                button: 'auth-button',
                input: 'auth-input',
              },
            }}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Correo Electrónico',
                  password_label: 'Contraseña',
                  email_input_placeholder: 'tu-correo@ejemplo.com',
                  password_input_placeholder: 'Tu contraseña',
                  button_label: 'Iniciar Sesión',
                  loading_button_label: 'Iniciando sesión...',
                  social_provider_text: 'Iniciar sesión con {{provider}}',
                  link_text: '¿Ya tienes una cuenta? Inicia sesión',
                },
                sign_up: {
                  email_label: 'Correo Electrónico',
                  password_label: 'Contraseña',
                  email_input_placeholder: 'tu-correo@ejemplo.com',
                  password_input_placeholder: 'Tu contraseña',
                  button_label: 'Registrarse',
                  loading_button_label: 'Registrando...',
                  social_provider_text: 'Registrarse con {{provider}}',
                  link_text: '¿No tienes cuenta? Regístrate',
                  confirmation_text: 'Revisa tu correo para confirmar tu cuenta',
                },
                forgotten_password: {
                  email_label: 'Correo Electrónico',
                  password_label: 'Contraseña',
                  email_input_placeholder: 'tu-correo@ejemplo.com',
                  button_label: 'Enviar instrucciones',
                  loading_button_label: 'Enviando instrucciones...',
                  link_text: '¿Olvidaste tu contraseña?',
                  confirmation_text: 'Revisa tu correo para restablecer tu contraseña',
                },
                update_password: {
                  password_label: 'Nueva Contraseña',
                  password_input_placeholder: 'Tu nueva contraseña',
                  button_label: 'Actualizar contraseña',
                  loading_button_label: 'Actualizando contraseña...',
                  confirmation_text: 'Tu contraseña ha sido actualizada',
                },
                verify_otp: {
                  email_input_label: 'Correo Electrónico',
                  email_input_placeholder: 'tu-correo@ejemplo.com',
                  phone_input_label: 'Número de Teléfono',
                  phone_input_placeholder: 'Tu número de teléfono',
                  token_input_label: 'Código',
                  token_input_placeholder: 'Tu código OTP',
                  button_label: 'Verificar código',
                  loading_button_label: 'Verificando...',
                },
              },
            }}
            theme="light"
            providers={[]}
            redirectTo={`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`}
          />

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Sistema de Gestión de Planillas y Costos Agrarios</p>
            <p className="mt-1">AGROPALL © 2025</p>
          </div>
        </div>
      </div>
    </div>
  )
}
