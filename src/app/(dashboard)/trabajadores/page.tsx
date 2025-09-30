'use client'

import { useState, useEffect } from 'react'
import Table from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import FormularioTrabajador from '@/components/domain/FormularioTrabajador'
import { getTrabajadores, type Trabajador } from '@/services/api'
import { createClient } from '@/lib/supabase/client'

export default function TrabajadoresPage() {
  const [trabajadoresList, setTrabajadoresList] = useState<Trabajador[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

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

  // Formatear los datos para la tabla
  const formatTableData = () => {
    return trabajadoresList.map((trabajador) => ({
      'ID': trabajador.id,
      'Nombre Completo': trabajador.nombre_completo,
      'DNI': trabajador.dni,
      'Modalidad': formatModalidad(trabajador.modalidad_principal),
      'Fecha Registro': formatFecha(trabajador.created_at)
    }))
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

      {/* Botón para abrir el modal de registro */}
      <div className="mb-6">
        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
        >
          + Registrar Nuevo Trabajador
        </Button>
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

      {/* Tabla de trabajadores */}
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

          {/* Tabla */}
          <Table
            headers={['ID', 'Nombre Completo', 'DNI', 'Modalidad', 'Fecha Registro']}
            data={formatTableData()}
          />
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
    </div>
  )
}
