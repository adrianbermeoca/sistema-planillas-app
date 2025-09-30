'use client'

import { useState, useEffect, FormEvent } from 'react'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import {
  getPuestosDeTrabajo,
  assignPuestoToTrabajador,
  type Trabajador,
  type PuestoDeTrabajo,
  type TrabajadorPuestoPayload
} from '@/services/api'
import { createClient } from '@/lib/supabase/client'

interface ModalAsignacionPuestoProps {
  isOpen: boolean
  onClose: () => void
  trabajador: Trabajador
  onSuccess?: () => void
}

export default function ModalAsignacionPuesto({
  isOpen,
  onClose,
  trabajador,
  onSuccess
}: ModalAsignacionPuestoProps) {
  const [puestosDisponibles, setPuestosDisponibles] = useState<PuestoDeTrabajo[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingPuestos, setLoadingPuestos] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorPuestos, setErrorPuestos] = useState<string | null>(null)

  // Estados del formulario
  const [formData, setFormData] = useState({
    puesto_id: '',
    tarifa_acordada: '',
    fecha_inicio: ''
  })

  const [fieldErrors, setFieldErrors] = useState<{
    puesto_id?: string
    tarifa_acordada?: string
    fecha_inicio?: string
  }>({})

  // Cargar puestos disponibles cuando el modal se abre
  useEffect(() => {
    if (isOpen) {
      loadPuestos()
      // Resetear formulario
      setFormData({
        puesto_id: '',
        tarifa_acordada: '',
        fecha_inicio: getTodayDate()
      })
      setError(null)
      setFieldErrors({})
    }
  }, [isOpen])

  // Función para cargar puestos de trabajo
  const loadPuestos = async () => {
    setLoadingPuestos(true)
    setErrorPuestos(null)

    try {
      const supabase = createClient()
      const { data, error } = await getPuestosDeTrabajo(supabase)

      if (error) {
        setErrorPuestos(error)
        return
      }

      if (data) {
        setPuestosDisponibles(data)
      }
    } catch (err) {
      console.error('Error al cargar puestos:', err)
      setErrorPuestos('Error inesperado al cargar los puestos de trabajo')
    } finally {
      setLoadingPuestos(false)
    }
  }

  // Obtener fecha de hoy en formato YYYY-MM-DD
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0]
  }

  // Validación del formulario
  const validateForm = (): boolean => {
    const errors: typeof fieldErrors = {}

    if (!formData.puesto_id) {
      errors.puesto_id = 'Debe seleccionar un puesto de trabajo'
    }

    if (!formData.tarifa_acordada) {
      errors.tarifa_acordada = 'La tarifa acordada es requerida'
    } else if (parseFloat(formData.tarifa_acordada) <= 0) {
      errors.tarifa_acordada = 'La tarifa debe ser mayor a 0'
    }

    if (!formData.fecha_inicio) {
      errors.fecha_inicio = 'La fecha de inicio es requerida'
    } else if (new Date(formData.fecha_inicio) > new Date()) {
      errors.fecha_inicio = 'La fecha de inicio no puede ser futura'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Manejo del envío del formulario
  const handleAssignment = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    // Validar formulario
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      // Construir payload
      const payload: TrabajadorPuestoPayload = {
        trabajador_id: trabajador.id,
        puesto_id: formData.puesto_id,
        tarifa_acordada: parseFloat(formData.tarifa_acordada),
        fecha_inicio: formData.fecha_inicio
      }

      // Llamar a la API
      const { data, error } = await assignPuestoToTrabajador(supabase, payload)

      if (error) {
        setError(error)
        return
      }

      // Éxito
      alert(`¡Puesto asignado exitosamente a ${trabajador.nombre_completo}!`)

      // Callback de éxito
      if (onSuccess) {
        onSuccess()
      }

      // Cerrar modal
      onClose()

    } catch (err) {
      console.error('Error al asignar puesto:', err)
      setError(err instanceof Error ? err.message : 'Error inesperado al asignar el puesto')
    } finally {
      setLoading(false)
    }
  }

  // Obtener el nombre del puesto seleccionado para mostrar la tarifa base
  const puestoSeleccionado = puestosDisponibles.find(
    p => p.id.toString() === formData.puesto_id
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Asignar Puesto a: ${trabajador.nombre_completo}`}
      className="max-w-2xl"
    >
      {/* Información del trabajador */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">DNI:</span> {trabajador.dni}
        </p>
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Modalidad:</span>{' '}
          {trabajador.modalidad_principal === 'planilla' && 'Planilla (Ley 31110)'}
          {trabajador.modalidad_principal === 'rh' && 'Recursos Humanos'}
          {trabajador.modalidad_principal === 'eventual' && 'Eventual'}
        </p>
      </div>

      {/* Error al cargar puestos */}
      {errorPuestos && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p className="font-medium">Error al cargar puestos:</p>
          <p className="text-sm">{errorPuestos}</p>
          <Button
            variant="secondary"
            onClick={loadPuestos}
            className="mt-2"
          >
            Reintentar
          </Button>
        </div>
      )}

      {/* Loading de puestos */}
      {loadingPuestos && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600 mt-2">Cargando puestos de trabajo...</p>
        </div>
      )}

      {/* Formulario */}
      {!loadingPuestos && !errorPuestos && (
        <form onSubmit={handleAssignment} className="space-y-4">
          {/* Error general del formulario */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              <p className="font-medium">Error al asignar puesto:</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Campo: Puesto de Trabajo */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Puesto de Trabajo *
            </label>
            <select
              value={formData.puesto_id}
              onChange={(e) => setFormData({ ...formData, puesto_id: e.target.value })}
              disabled={loading || puestosDisponibles.length === 0}
              required
              className={`w-full px-3 py-2 border rounded-lg text-gray-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                fieldErrors.puesto_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Seleccione un puesto</option>
              {puestosDisponibles.map((puesto) => (
                <option key={puesto.id} value={puesto.id}>
                  {puesto.nombre_puesto} (Tarifa base: S/. {puesto.tarifa_base_dia.toFixed(2)}/día)
                </option>
              ))}
            </select>
            {fieldErrors.puesto_id && (
              <p className="text-sm text-red-600">{fieldErrors.puesto_id}</p>
            )}
          </div>

          {/* Información de tarifa base (si hay puesto seleccionado) */}
          {puestoSeleccionado && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Tarifa base del puesto:</span>{' '}
                S/. {puestoSeleccionado.tarifa_base_dia.toFixed(2)} / día
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Puede ajustar la tarifa acordada según las negociaciones con el trabajador
              </p>
            </div>
          )}

          {/* Campo: Tarifa Acordada */}
          <Input
            label="Tarifa Acordada (S/. por día) *"
            type="number"
            step="0.01"
            min="0"
            value={formData.tarifa_acordada}
            onChange={(e) => setFormData({ ...formData, tarifa_acordada: e.target.value })}
            error={fieldErrors.tarifa_acordada}
            disabled={loading}
            placeholder="Ej: 150.00"
            required
          />

          {/* Campo: Fecha de Inicio */}
          <Input
            label="Fecha de Inicio de Asignación *"
            type="date"
            value={formData.fecha_inicio}
            onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
            error={fieldErrors.fecha_inicio}
            disabled={loading}
            max={getTodayDate()}
            required
          />

          {/* Botones de acción */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              variant="primary"
              disabled={loading || puestosDisponibles.length === 0}
              className="flex-1"
            >
              {loading ? 'Asignando...' : 'Asignar Puesto'}
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
          </div>

          {/* Nota informativa */}
          <p className="text-xs text-gray-500 pt-2">
            * Campos obligatorios. La tarifa acordada se usa para el cálculo de la planilla (RN-001-C).
          </p>
        </form>
      )}
    </Modal>
  )
}
