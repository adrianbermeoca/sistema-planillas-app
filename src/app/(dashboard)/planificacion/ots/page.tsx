'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { getOrdenesDeTrabajo, type OrdenDeTrabajoConInfo } from '@/services/api'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import FormularioPlanificacionOT from '@/components/domain/FormularioPlanificacionOT'

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
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${claseEstado}`}
    >
      {estado}
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
 * Página principal de Gestión de Órdenes de Trabajo (CU-006).
 * Permite listar todas las OTs existentes y crear nuevas.
 */
export default function PlanificacionOTsPage() {
  const router = useRouter()

  // Estados de datos
  const [ordenes, setOrdenes] = useState<OrdenDeTrabajoConInfo[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estado del modal
  const [modalAbierto, setModalAbierto] = useState(false)

  // ========== CARGA DE DATOS ==========

  /**
   * Carga las órdenes de trabajo desde la API.
   */
  const cargarOrdenes = async () => {
    setCargando(true)
    setError(null)

    try {
      const { data, error: apiError } = await getOrdenesDeTrabajo(supabase)

      if (apiError) {
        throw new Error(apiError)
      }

      setOrdenes(data || [])
    } catch (err) {
      console.error('Error al cargar órdenes de trabajo:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setCargando(false)
    }
  }

  // Cargar órdenes al montar el componente
  useEffect(() => {
    cargarOrdenes()
  }, [])

  // ========== HANDLERS ==========

  /**
   * Handler para cuando se crea exitosamente una OT.
   * Recarga la lista y cierra el modal.
   */
  const handleSuccess = () => {
    cargarOrdenes()
    setModalAbierto(false)
  }

  /**
   * Handler para navegar al detalle de una OT.
   */
  const handleVerDetalle = (otId: string | number) => {
    router.push(`/planificacion/ots/${otId}`)
  }

  // ========== RENDERIZADO ==========

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Órdenes de Trabajo (Planificación)
          </h1>
          <p className="text-gray-600 mt-1">
            Planifica las labores a ejecutar en los sublotes (CU-006)
          </p>
        </div>

        <Button onClick={() => setModalAbierto(true)}>+ Crear Nueva OT</Button>
      </div>

      {/* Información contextual */}
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
            <p className="font-medium">Sobre las Órdenes de Trabajo</p>
            <p className="mt-1">
              Las OTs definen qué labores se planifican ejecutar en qué sublotes y durante qué
              periodo. Sirven como base para el registro del Parte Diario (Tareo).
            </p>
          </div>
        </div>
      </div>

      {/* Estados de carga y error */}
      {cargando && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            <p className="mt-3 text-gray-600">Cargando órdenes de trabajo...</p>
          </div>
        </div>
      )}

      {error && !cargando && (
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
              <h3 className="text-red-800 font-medium">Error al cargar datos</h3>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <Button onClick={cargarOrdenes} variant="secondary" className="mt-3">
                Reintentar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de órdenes de trabajo */}
      {!cargando && !error && (
        <>
          {ordenes.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <svg
                className="w-12 h-12 text-gray-400 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="text-gray-900 font-medium mb-1">No hay órdenes de trabajo</h3>
              <p className="text-gray-600 text-sm mb-4">
                Comienza creando tu primera orden de trabajo planificada.
              </p>
              <Button onClick={() => setModalAbierto(true)}>+ Crear Primera OT</Button>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descripción
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha Inicio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha Fin
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supervisor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Labores
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {ordenes.map((orden) => (
                      <tr
                        key={orden.id}
                        className="hover:bg-blue-50 transition-colors cursor-pointer"
                        onClick={() => handleVerDetalle(orden.id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                          #{orden.id}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="max-w-xs">
                            <p className="font-medium">{orden.descripcion}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {formatearFecha(orden.fecha_planificacion_inicio)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {formatearFecha(orden.fecha_planificacion_fin)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {orden.supervisor_nombre || (
                            <span className="text-gray-400 italic">Sin asignar</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {orden.total_labores || 0} {orden.total_labores === 1 ? 'labor' : 'labores'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <EstadoBadge estado={orden.estado} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={(e) => {
                              e.stopPropagation() // Evita que se dispare el click de la fila
                              handleVerDetalle(orden.id)
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Ver detalle →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer con contador */}
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Total: <span className="font-medium text-gray-900">{ordenes.length}</span>{' '}
                  {ordenes.length === 1 ? 'orden de trabajo' : 'órdenes de trabajo'}
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de creación */}
      <Modal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title="Crear Nueva Orden de Trabajo"
      >
        <FormularioPlanificacionOT onClose={() => setModalAbierto(false)} onSuccess={handleSuccess} />
      </Modal>
    </div>
  )
}
