'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import Table from '@/components/ui/Table'
import Button from '@/components/ui/Button'

// Importación de tipos generados
import type { Trabajador, PuestoTrabajo } from '@/lib/database.types'

// Tipo compuesto para trabajador con puesto
interface TrabajadorConPuesto extends Trabajador {
  puestos_de_trabajo?: PuestoTrabajo
}

export default function TablaTrabajadores() {
  // Estados tipados con los tipos generados de Supabase
  const [trabajadores, setTrabajadores] = useState<TrabajadorConPuesto[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTrabajadores()
  }, [])

  const fetchTrabajadores = async () => {
    try {
      setLoading(true)

      // Query tipado con Supabase
      const { data, error } = await supabase
        .from('trabajadores')
        .select(`
          *,
          puestos_de_trabajo:puesto_id (
            id,
            nombre,
            salario_base
          )
        `)
        .eq('activo', true)
        .order('apellidos', { ascending: true })

      if (error) {
        throw error
      }

      // data ya está tipado como TrabajadorConPuesto[] automáticamente
      setTrabajadores(data || [])
    } catch (err) {
      console.error('Error fetching trabajadores:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  // Preparar datos para la tabla
  const headers = ['Nombres', 'Apellidos', 'DNI', 'Puesto', 'Salario Base', 'Fecha Ingreso']

  const dataForTable = trabajadores.map(trabajador => ({
    'Nombres': trabajador.nombres,
    'Apellidos': trabajador.apellidos,
    'DNI': trabajador.dni,
    'Puesto': trabajador.puestos_de_trabajo?.nombre || 'Sin asignar',
    'Salario Base': trabajador.puestos_de_trabajo?.salario_base
      ? `S/ ${trabajador.puestos_de_trabajo.salario_base.toFixed(2)}`
      : 'N/A',
    'Fecha Ingreso': new Date(trabajador.fecha_ingreso).toLocaleDateString('es-ES')
  }))

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error: {error}</p>
        <Button onClick={fetchTrabajadores} variant="secondary" className="mt-2">
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Trabajadores Registrados
          </h2>
          <p className="text-gray-600 mt-1">
            Total: {trabajadores.length} trabajadores activos
          </p>
        </div>
        <Button variant="primary">
          Nuevo Trabajador
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200">
        <Table
          headers={headers}
          data={dataForTable}
        />
      </div>
    </div>
  )
}