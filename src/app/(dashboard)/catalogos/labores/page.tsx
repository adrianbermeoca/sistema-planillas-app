'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { getLabores, type Labor } from '@/services/api'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import ModalLaborForm from '@/components/domain/ModalLaborForm'

/**
 * Badge para mostrar el estado de una labor.
 */
function EstadoBadge({ activo }: { activo: boolean }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
      }`}
    >
      {activo ? 'Activo' : 'Inactivo'}
    </span>
  )
}

/**
 * Badge para mostrar el método de pago.
 */
function MetodoPagoBadge({ metodo }: { metodo: string }) {
  const estilos: Record<string, string> = {
    PorTiempo: 'bg-blue-100 text-blue-800',
    PorDestajo: 'bg-purple-100 text-purple-800'
  }

  const clase = estilos[metodo] || 'bg-gray-100 text-gray-800'

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${clase}`}>
      {metodo === 'PorTiempo' ? 'Por Tiempo' : 'Por Destajo'}
    </span>
  )
}

/**
 * Página de Gestión del Catálogo de Labores (CU-008).
 */
export default function LaboresPage() {
  // Estados de datos
  const [labores, setLabores] = useState<Labor[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estado del modal
  const [modalAbierto, setModalAbierto] = useState(false)
  const [laborSeleccionada, setLaborSeleccionada] = useState<Labor | null>(null)

  // ========== CARGA DE DATOS ==========

  const cargarLabores = async () => {
    setCargando(true)
    setError(null)

    try {
      // Obtener todas las labores (activas e inactivas)
      const { data, error: apiError } = await getLabores(supabase, false)

      if (apiError) {
        throw new Error(apiError)
      }

      setLabores(data || [])
    } catch (err) {
      console.error('Error al cargar labores:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarLabores()
  }, [])

  // ========== HANDLERS ==========

  const handleSuccess = () => {
    cargarLabores()
    setModalAbierto(false)
    setLaborSeleccionada(null)
  }

  const handleCrear = () => {
    setLaborSeleccionada(null)
    setModalAbierto(true)
  }

  const handleEditar = (labor: Labor) => {
    setLaborSeleccionada(labor)
    setModalAbierto(true)
  }

  // ========== RENDERIZADO ==========

  return (
    <div className="p-6 space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Catálogo de Labores
          </h1>
          <p className="text-gray-600 mt-1">
            Gestión de tareas y actividades agrícolas (CU-008)
          </p>
        </div>

        <Button onClick={handleCrear}>+ Crear Nueva Labor</Button>
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
            <p className="font-medium">Sobre las Labores</p>
            <p className="mt-1">
              Las labores definen las actividades que se realizan en el campo. Pueden ser por tiempo (pago por horas)
              o por destajo (pago por avance). Estas se utilizan en la planificación de OTs y registro de tareos.
            </p>
          </div>
        </div>
      </div>

      {/* Estados de carga y error */}
      {cargando && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            <p className="mt-3 text-gray-600">Cargando labores...</p>
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
              <Button onClick={cargarLabores} variant="secondary" className="mt-3">
                Reintentar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de labores */}
      {!cargando && !error && (
        <>
          {labores.length === 0 ? (
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="text-gray-900 font-medium mb-1">No hay labores registradas</h3>
              <p className="text-gray-600 text-sm mb-4">
                Comienza creando la primera labor del catálogo.
              </p>
              <Button onClick={handleCrear}>+ Crear Primera Labor</Button>
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
                        Nombre de la Labor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Método de Pago
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Indicador Destajo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tarifa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
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
                    {labores.map((labor) => (
                      <tr key={labor.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{labor.id}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="font-medium">{labor.nombre_labor}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <MetodoPagoBadge metodo={labor.metodo_pago} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {labor.indicador_destajo || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {labor.metodo_pago === 'PorDestajo' ? `S/ ${labor.tarifa_destajo.toFixed(2)}` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {labor.es_labor_generica ? (
                            <span className="text-orange-700 font-medium">Genérica</span>
                          ) : (
                            <span className="text-gray-600">Productiva</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <EstadoBadge activo={labor.es_activo} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleEditar(labor)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Editar
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
                  Total: <span className="font-medium text-gray-900">{labores.length}</span>{' '}
                  {labores.length === 1 ? 'labor' : 'labores'}
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de creación/edición */}
      <Modal
        isOpen={modalAbierto}
        onClose={() => {
          setModalAbierto(false)
          setLaborSeleccionada(null)
        }}
        title={laborSeleccionada ? 'Editar Labor' : 'Crear Nueva Labor'}
      >
        <ModalLaborForm
          labor={laborSeleccionada}
          onClose={() => {
            setModalAbierto(false)
            setLaborSeleccionada(null)
          }}
          onSuccess={handleSuccess}
        />
      </Modal>
    </div>
  )
}
