'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import ModalPuestoForm from '@/components/domain/ModalPuestoForm'
import { getPuestosDeTrabajo } from '@/services/api'
import { createClient } from '@/lib/supabase/client'
import type { PuestoTrabajo } from '@/lib/supabase/client'

export default function PuestosPage() {
  const [puestosList, setPuestosList] = useState<PuestoTrabajo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados de control de modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPuesto, setSelectedPuesto] = useState<PuestoTrabajo | null>(null)

  // Función para cargar la lista de puestos (SIN filtro - ver todos)
  const loadPuestos = async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data, error: fetchError } = await getPuestosDeTrabajo(supabase, false) // false = ver todos

      if (fetchError) {
        setError(fetchError)
        return
      }

      setPuestosList(data || [])
    } catch (err) {
      console.error('Error al cargar puestos:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar puestos')
    } finally {
      setLoading(false)
    }
  }

  // Cargar puestos al montar el componente
  useEffect(() => {
    loadPuestos()
  }, [])

  // Callback para recargar la lista después de crear/editar/cambiar estado
  const handleSuccess = () => {
    setIsModalOpen(false)
    setSelectedPuesto(null)
    loadPuestos()
  }

  // Manejador para abrir modal de creación
  const handleCrearPuesto = () => {
    setSelectedPuesto(null)
    setIsModalOpen(true)
  }

  // Manejador para abrir modal de edición
  const handleEditarPuesto = (puesto: PuestoTrabajo) => {
    setSelectedPuesto(puesto)
    setIsModalOpen(true)
  }

  // Cerrar modal
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedPuesto(null)
  }

  // Formatear tarifa a moneda peruana
  const formatTarifa = (tarifa: number): string => {
    return `S/. ${tarifa.toFixed(2)}`
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gestión de Puestos de Trabajo
        </h1>
        <p className="text-gray-600">
          Administra el catálogo de puestos disponibles para asignar a trabajadores (CU-008)
        </p>
      </div>

      {/* Header de acciones */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Button
            variant="primary"
            onClick={handleCrearPuesto}
          >
            + Crear Nuevo Puesto
          </Button>
        </div>

        {/* Info de ayuda */}
        <div className="text-sm text-gray-600">
          <span className="inline-flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Los puestos inactivos no aparecerán al asignar trabajadores
          </span>
        </div>
      </div>

      {/* Estados de carga y error */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Cargando puestos...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg mb-6">
          <p className="font-medium">Error al cargar puestos:</p>
          <p className="text-sm">{error}</p>
          <Button
            variant="secondary"
            onClick={loadPuestos}
            className="mt-3"
          >
            Reintentar
          </Button>
        </div>
      )}

      {/* Tabla de puestos */}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow">
          {/* Stats */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">
                  {puestosList.length}
                </span>
                {' '}puesto{puestosList.length !== 1 ? 's' : ''} registrado{puestosList.length !== 1 ? 's' : ''}
              </p>
              <div className="flex gap-4 text-xs text-gray-600">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Activos: {puestosList.filter(p => p.es_activo).length}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Inactivos: {puestosList.filter(p => !p.es_activo).length}
                </span>
              </div>
            </div>
          </div>

          {/* Tabla customizada */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Nombre del Puesto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Tarifa Base Día
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {puestosList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No hay puestos registrados. Crea el primer puesto para comenzar.
                    </td>
                  </tr>
                ) : (
                  puestosList.map((puesto) => (
                    <tr
                      key={puesto.id}
                      className={`hover:bg-gray-50 transition-colors duration-150 ${
                        !puesto.es_activo ? 'bg-gray-50 opacity-60' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {puesto.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {puesto.nombre_puesto}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {formatTarifa(puesto.tarifa_base_dia)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            puesto.es_activo
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {puesto.es_activo ? '✓ Activo' : '✗ Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <button
                          onClick={() => handleEditarPuesto(puesto)}
                          className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                          title="Editar puesto"
                        >
                          ✏️ Editar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de formulario */}
      <ModalPuestoForm
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        puesto={selectedPuesto}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
