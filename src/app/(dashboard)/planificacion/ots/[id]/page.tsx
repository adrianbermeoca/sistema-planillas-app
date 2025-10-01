'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { getOrdenDeTrabajoById, type OrdenDeTrabajoCompleta } from '@/services/api'
import Button from '@/components/ui/Button'

/**
 * Componente para mostrar un badge de estado con colores.
 */
function EstadoBadge({ estado }: { estado: string }) {
  const estilos: Record<string, string> = {
    Pendiente: 'bg-yellow-100 text-yellow-800',
    'En Ejecución': 'bg-blue-100 text-blue-800',
    Finalizada: 'bg-green-100 text-green-800',
    Cancelada: 'bg-red-100 text-red-800'
  }

  const claseEstado = estilos[estado] || 'bg-gray-100 text-gray-800'

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${claseEstado}`}
    >
      {estado}
    </span>
  )
}

/**
 * Componente para mostrar un badge de método de pago.
 */
function MetodoPagoBadge({ metodo }: { metodo: 'PorTiempo' | 'PorDestajo' }) {
  const estilos = {
    PorTiempo: 'bg-blue-100 text-blue-800',
    PorDestajo: 'bg-purple-100 text-purple-800'
  }

  const textos = {
    PorTiempo: 'Por Tiempo',
    PorDestajo: 'Por Destajo'
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estilos[metodo]}`}>
      {textos[metodo]}
    </span>
  )
}

/**
 * Formatea una fecha en formato ISO a DD/MM/YYYY.
 */
function formatearFecha(fechaISO: string | null): string {
  if (!fechaISO) return '-'

  try {
    const fecha = new Date(fechaISO)
    const dia = fecha.getDate().toString().padStart(2, '0')
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0')
    const anio = fecha.getFullYear()
    return `${dia}/${mes}/${anio}`
  } catch {
    return fechaISO
  }
}

/**
 * Página de detalle de una Orden de Trabajo (CU-006).
 * Muestra información completa de la OT y sus labores/sublotes planificados.
 */
export default function OrdenDeTrabajoDetallePage() {
  const router = useRouter()
  const params = useParams()
  const otId = params.id as string

  // Estados de datos
  const [orden, setOrden] = useState<OrdenDeTrabajoCompleta | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ========== CARGA DE DATOS ==========

  /**
   * Carga la orden de trabajo desde la API.
   */
  const cargarOrden = async () => {
    setCargando(true)
    setError(null)

    try {
      const { data, error: apiError } = await getOrdenDeTrabajoById(supabase, otId)

      if (apiError) {
        throw new Error(apiError)
      }

      if (!data) {
        throw new Error('No se encontró la orden de trabajo.')
      }

      setOrden(data)
    } catch (err) {
      console.error('Error al cargar orden de trabajo:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setCargando(false)
    }
  }

  // Cargar orden al montar el componente
  useEffect(() => {
    if (otId) {
      cargarOrden()
    }
  }, [otId])

  // ========== HANDLERS ==========

  /**
   * Handler para volver al listado de OTs.
   */
  const handleVolver = () => {
    router.push('/planificacion/ots')
  }

  // ========== RENDERIZADO ==========

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <p className="mt-3 text-gray-600">Cargando orden de trabajo...</p>
        </div>
      </div>
    )
  }

  if (error || !orden) {
    return (
      <div className="space-y-6">
        {/* Header con botón de volver */}
        <div className="flex items-center gap-4">
          <Button onClick={handleVolver} variant="secondary">
            ← Volver al Listado
          </Button>
        </div>

        {/* Error */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-red-600 mt-0.5 mr-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="text-red-800 font-medium">Error al cargar orden de trabajo</h3>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <div className="mt-3 flex gap-2">
                <Button onClick={cargarOrden} variant="secondary">
                  Reintentar
                </Button>
                <Button onClick={handleVolver} variant="secondary">
                  Volver al Listado
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={handleVolver} variant="secondary">
            ← Volver
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                Orden de Trabajo #{orden.id}
              </h1>
              <EstadoBadge estado={orden.estado} />
            </div>
            <p className="text-gray-600 mt-1">{orden.descripcion}</p>
          </div>
        </div>
      </div>

      {/* Información General */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Información General</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Fecha de Inicio */}
          <div>
            <p className="text-sm text-gray-500 mb-1">Fecha de Inicio</p>
            <p className="text-base font-medium text-gray-900">
              {formatearFecha(orden.fecha_planificacion_inicio)}
            </p>
          </div>

          {/* Fecha de Fin */}
          <div>
            <p className="text-sm text-gray-500 mb-1">Fecha de Fin</p>
            <p className="text-base font-medium text-gray-900">
              {formatearFecha(orden.fecha_planificacion_fin)}
            </p>
          </div>

          {/* Supervisor */}
          <div>
            <p className="text-sm text-gray-500 mb-1">Supervisor Asignado</p>
            <p className="text-base font-medium text-gray-900">
              {orden.supervisor_nombre || (
                <span className="text-gray-400 italic">Sin asignar</span>
              )}
            </p>
          </div>

          {/* Fecha de Creación */}
          <div>
            <p className="text-sm text-gray-500 mb-1">Fecha de Creación</p>
            <p className="text-base font-medium text-gray-900">
              {formatearFecha(orden.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Detalles de Labores y Sublotes */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">
            Labores y Sublotes Planificados
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {orden.detalles.length} {orden.detalles.length === 1 ? 'labor planificada' : 'labores planificadas'}
          </p>
        </div>

        {orden.detalles.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No hay labores planificadas para esta orden de trabajo.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Labor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Método de Pago
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sublote
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variedad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Horas Estimadas
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orden.detalles.map((detalle) => (
                  <tr key={detalle.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {detalle.labor_nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <MetodoPagoBadge metodo={detalle.labor_metodo_pago} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {detalle.sublote_nombre}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {detalle.sublote_variedad || (
                        <span className="text-gray-400 italic">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {detalle.horas_estimadas !== null ? (
                        `${detalle.horas_estimadas} hs`
                      ) : (
                        <span className="text-gray-400 italic">No especificado</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Información Adicional / Acciones Futuras */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5 mr-3"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium">Próximas Funcionalidades</p>
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>Editar orden de trabajo</li>
              <li>Cambiar estado de la OT</li>
              <li>Asignar supervisor</li>
              <li>Ver historial de modificaciones</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
