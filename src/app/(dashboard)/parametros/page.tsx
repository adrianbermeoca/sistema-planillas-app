'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { getLegalParameters, createLegalParameter } from '@/services/api'
import type { ParametroLegal } from '@/lib/database.types'
import TablaParametros from '@/components/domain/TablaParametros'
import FormularioNuevaVigencia from '@/components/domain/FormularioNuevaVigencia'

interface NuevaVigenciaData {
  parametro: string
  nuevoValor: string
  fechaInicioVigencia: string
}

export default function ParametrosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [parametros, setParametros] = useState<ParametroLegal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showOnlyActive, setShowOnlyActive] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  const fetchParametros = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getLegalParameters(supabase)
      setParametros(data)
    } catch (err) {
      console.error('Error fetching legal parameters:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar parámetros')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchParametros()
  }, [])

  const handleAbrirModal = () => {
    setModalError(null) // Limpiar errores previos
    setIsModalOpen(true)
  }

  const handleCerrarModal = () => {
    setIsModalOpen(false)
  }

  const handleGuardarVigencia = async (data: NuevaVigenciaData) => {
    try {
      setIsSaving(true)
      setModalError(null)

      // Preparar los datos para la API
      const newParameterData: Omit<ParametroLegal, 'id' | 'created_at'> = {
        tipo: data.parametro as ParametroLegal['tipo'],
        valor: parseFloat(data.nuevoValor),
        fecha_inicio_vigencia: data.fechaInicioVigencia,
        fecha_fin_vigencia: null,
        descripcion: null
      }

      // Crear el nuevo parámetro
      await createLegalParameter(supabase, newParameterData)

      // Cerrar modal y refrescar datos
      setIsModalOpen(false)
      await fetchParametros()

      // Mostrar mensaje de éxito
      alert(`Nueva vigencia creada exitosamente:

Parámetro: ${data.parametro}
Nuevo Valor: ${data.nuevoValor}
Vigencia desde: ${new Date(data.fechaInicioVigencia).toLocaleDateString('es-ES')}

La tabla ha sido actualizada con el nuevo parámetro.`)

    } catch (err) {
      console.error('Error creating legal parameter:', err)

      // Capturar el mensaje de error específico de Supabase
      const errorMessage = err instanceof Error
        ? err.message
        : 'Error desconocido al crear el parámetro'

      setModalError(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li>
              <a href="#" className="hover:text-gray-700">Dashboard</a>
            </li>
            <li className="flex items-center">
              <svg className="h-4 w-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <span className="font-medium text-gray-900">Parámetros Legales</span>
            </li>
          </ol>
        </nav>

        {/* Contenido principal */}
        <main>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Cargando parámetros legales...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error al cargar parámetros legales
                  </h3>
                  <p className="text-sm text-red-700 mt-1">
                    {error}
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-2 text-sm text-red-800 underline hover:text-red-600"
                  >
                    Intentar nuevamente
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <TablaParametros
              onCrearNuevaVigencia={handleAbrirModal}
              parametros={parametros}
            />
          )}
        </main>

        {/* Modal para crear nueva vigencia */}
        <FormularioNuevaVigencia
          isOpen={isModalOpen}
          onClose={handleCerrarModal}
          onSave={handleGuardarVigencia}
          isSaving={isSaving}
          modalError={modalError}
        />
      </div>
    </div>
  )
}