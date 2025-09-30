'use client'

import { useState, useEffect } from 'react'
import Table from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import FormularioTrabajador from '@/components/domain/FormularioTrabajador'
import ModalEdicionTrabajador from '@/components/domain/ModalEdicionTrabajador'
import ModalAsignacionPuesto from '@/components/domain/ModalAsignacionPuesto'
import { getTrabajadores, type Trabajador } from '@/services/api'
import { createClient } from '@/lib/supabase/client'

export default function TrabajadoresPage() {
  const [trabajadoresList, setTrabajadoresList] = useState<Trabajador[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados de control de modales
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false)
  const [selectedTrabajador, setSelectedTrabajador] = useState<Trabajador | null>(null)

  // Función para cargar la lista de trabajadores
  const loadTrabajadores = async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const data = await getTrabajadores(supabase)
      setTrabajadoresList(data)
    } catch (err) {
      console.error('Error al cargar trabajadores:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar trabajadores')
    } finally {
      setLoading(false)
    }
  }

  // Cargar trabajadores al montar el componente
  useEffect(() => {
    loadTrabajadores()
  }, [])

  // Callback para recargar la lista después de registrar un trabajador
  const handleRegistroExitoso = () => {
    setIsModalOpen(false)
    loadTrabajadores()
  }

  // Callback para recargar después de edición o asignación
  const handleActionSuccess = () => {
    setIsEditModalOpen(false)
    setIsAssignmentModalOpen(false)
    setSelectedTrabajador(null)
    loadTrabajadores()
  }

  // Manejadores de acciones
  const handleEditarTrabajador = (trabajador: Trabajador) => {
    setSelectedTrabajador(trabajador)
    setIsEditModalOpen(true)
  }

  const handleAsignarPuesto = (trabajador: Trabajador) => {
    setSelectedTrabajador(trabajador)
    setIsAssignmentModalOpen(true)
  }

  // Cerrar modales de acción
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setSelectedTrabajador(null)
  }

  const handleCloseAssignmentModal = () => {
    setIsAssignmentModalOpen(false)
    setSelectedTrabajador(null)
  }

  // Formatear la modalidad laboral para mejor legibilidad
  const formatModalidad = (modalidad: string): string => {
    const modalidades: Record<string, string> = {
      'planilla': 'Planilla (Ley 31110)',
      'rh': 'Recursos Humanos',
      'eventual': 'Eventual'
    }
    return modalidades[modalidad] || modalidad
  }

  // Formatear fecha a formato local
  const formatFecha = (fecha: string): string => {
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gestión de Trabajadores
        </h1>
        <p className="text-gray-600">
          Registra y administra el personal de planilla, RH y eventuales
        </p>
      </div>

      {/* Header de acciones */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
          >
            + Registrar Nuevo Trabajador
          </Button>
        </div>

        {/* Info de ayuda */}
        <div className="text-sm text-gray-600">
          <span className="inline-flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Solo trabajadores de <strong>Planilla</strong> pueden tener múltiples puestos asignados (CU-009)
          </span>
        </div>
      </div>

      {/* Estados de carga y error */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Cargando trabajadores...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg mb-6">
          <p className="font-medium">Error al cargar trabajadores:</p>
          <p className="text-sm">{error}</p>
          <Button
            variant="secondary"
            onClick={loadTrabajadores}
            className="mt-3"
          >
            Reintentar
          </Button>
        </div>
      )}

      {/* Tabla de trabajadores con acciones */}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow">
          {/* Stats */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">
                {trabajadoresList.length}
              </span>
              {' '}trabajador{trabajadoresList.length !== 1 ? 'es' : ''} registrado{trabajadoresList.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Tabla customizada con botones de acción */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Nombre Completo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    DNI
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Modalidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Fecha Registro
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {trabajadoresList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No hay trabajadores registrados
                    </td>
                  </tr>
                ) : (
                  trabajadoresList.map((trabajador) => (
                    <tr
                      key={trabajador.id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {trabajador.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {trabajador.nombre_completo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {trabajador.dni}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatModalidad(trabajador.modalidad_principal)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatFecha(trabajador.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <div className="flex justify-center gap-2">
                          {/* Botón Editar - Disponible para todos */}
                          <button
                            onClick={() => handleEditarTrabajador(trabajador)}
                            className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                            title="Editar información del trabajador"
                          >
                            ✏️ Editar
                          </button>

                          {/* Botón Asignar Puesto - Solo para trabajadores de Planilla */}
                          {trabajador.modalidad_principal === 'planilla' && (
                            <button
                              onClick={() => handleAsignarPuesto(trabajador)}
                              className="px-3 py-1 text-xs font-medium text-green-700 bg-green-50 rounded hover:bg-green-100 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                              title="Asignar puesto de trabajo (Multimodalidad - CU-009)"
                            >
                              👔 Asignar Puesto
                            </button>
                          )}

                          {/* Badge informativo para Eventuales/RH */}
                          {(trabajador.modalidad_principal === 'eventual' || trabajador.modalidad_principal === 'rh') && (
                            <span className="px-3 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded cursor-help" title="Los trabajadores eventuales y RH tienen tarifa fija, no requieren asignación de puesto">
                              Tarifa Fija
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal con formulario de registro */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Nuevo Trabajador"
        className="max-w-2xl"
      >
        <FormularioTrabajador
          onSuccess={handleRegistroExitoso}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      {/* Modal de edición de trabajador */}
      {selectedTrabajador && (
        <ModalEdicionTrabajador
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          trabajador={selectedTrabajador}
          onSuccess={handleActionSuccess}
        />
      )}

      {/* Modal de asignación de puesto */}
      {selectedTrabajador && (
        <ModalAsignacionPuesto
          isOpen={isAssignmentModalOpen}
          onClose={handleCloseAssignmentModal}
          trabajador={selectedTrabajador}
          onSuccess={handleActionSuccess}
        />
      )}
    </div>
  )
}
