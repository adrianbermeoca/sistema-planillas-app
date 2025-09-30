'use client'

import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { createPuesto, updatePuesto, togglePuestoStatus } from '@/services/api'
import { createClient } from '@/lib/supabase/client'
import type { PuestoTrabajo } from '@/lib/supabase/client'

interface ModalPuestoFormProps {
  isOpen: boolean
  onClose: () => void
  puesto?: PuestoTrabajo | null
  onSuccess: () => void
}

export default function ModalPuestoForm({
  isOpen,
  onClose,
  puesto = null,
  onSuccess
}: ModalPuestoFormProps) {
  const isEditMode = !!puesto

  const [formData, setFormData] = useState({
    nombre_puesto: '',
    tarifa_base_dia: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)

  // Cargar datos del puesto en modo edición
  useEffect(() => {
    if (isEditMode && puesto) {
      setFormData({
        nombre_puesto: puesto.nombre_puesto,
        tarifa_base_dia: puesto.tarifa_base_dia.toString()
      })
    } else {
      // Limpiar formulario en modo creación
      setFormData({
        nombre_puesto: '',
        tarifa_base_dia: ''
      })
    }
    setErrors({})
    setSubmitError(null)
  }, [isEditMode, puesto, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Limpiar error del campo al modificar
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Validar nombre_puesto
    if (!formData.nombre_puesto.trim()) {
      newErrors.nombre_puesto = 'El nombre del puesto es obligatorio'
    } else if (formData.nombre_puesto.trim().length < 3) {
      newErrors.nombre_puesto = 'El nombre debe tener al menos 3 caracteres'
    }

    // Validar tarifa_base_dia
    if (!formData.tarifa_base_dia.trim()) {
      newErrors.tarifa_base_dia = 'La tarifa base es obligatoria'
    } else {
      const tarifa = parseFloat(formData.tarifa_base_dia)
      if (isNaN(tarifa) || tarifa <= 0) {
        newErrors.tarifa_base_dia = 'La tarifa debe ser un número mayor a 0'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const tarifa = parseFloat(formData.tarifa_base_dia)

      if (isEditMode && puesto) {
        // Modo edición
        const updateData: any = {}

        if (formData.nombre_puesto.trim() !== puesto.nombre_puesto) {
          updateData.nombre_puesto = formData.nombre_puesto.trim()
        }

        if (tarifa !== puesto.tarifa_base_dia) {
          updateData.tarifa_base_dia = tarifa
        }

        if (Object.keys(updateData).length === 0) {
          alert('No se detectaron cambios para guardar')
          setIsSubmitting(false)
          return
        }

        const { error } = await updatePuesto(supabase, puesto.id, updateData)

        if (error) {
          setSubmitError(error)
          setIsSubmitting(false)
          return
        }

        alert('Puesto actualizado exitosamente')
      } else {
        // Modo creación
        const { error } = await createPuesto(
          supabase,
          formData.nombre_puesto.trim(),
          tarifa
        )

        if (error) {
          setSubmitError(error)
          setIsSubmitting(false)
          return
        }

        alert('Puesto creado exitosamente')
      }

      setIsSubmitting(false)
      onSuccess()
      onClose()

    } catch (err) {
      console.error('Error inesperado al procesar formulario:', err)
      setSubmitError('Error inesperado. Por favor, intenta de nuevo.')
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async () => {
    if (!puesto) return

    const accion = puesto.es_activo ? 'desactivar' : 'reactivar'
    const confirmacion = confirm(
      `¿Está seguro que desea ${accion} el puesto "${puesto.nombre_puesto}"?`
    )

    if (!confirmacion) return

    setIsTogglingStatus(true)

    try {
      const supabase = createClient()
      const nuevoEstado = !puesto.es_activo

      const { error } = await togglePuestoStatus(supabase, puesto.id, nuevoEstado)

      if (error) {
        alert(`Error al ${accion} el puesto: ${error}`)
        setIsTogglingStatus(false)
        return
      }

      alert(`Puesto ${accion === 'desactivar' ? 'desactivado' : 'reactivado'} exitosamente`)
      setIsTogglingStatus(false)
      onSuccess()
      onClose()

    } catch (err) {
      console.error(`Error al ${accion} el puesto:`, err)
      alert(`Error inesperado al ${accion} el puesto`)
      setIsTogglingStatus(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Editar Puesto de Trabajo' : 'Crear Nuevo Puesto'}
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nombre del Puesto */}
        <div>
          <label htmlFor="nombre_puesto" className="block text-sm font-medium text-gray-700 mb-2">
            Nombre del Puesto <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="nombre_puesto"
            name="nombre_puesto"
            value={formData.nombre_puesto}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.nombre_puesto
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            placeholder="Ej: Tractorista, Fumigador, Regador"
          />
          {errors.nombre_puesto && (
            <p className="text-red-500 text-sm mt-1">{errors.nombre_puesto}</p>
          )}
        </div>

        {/* Tarifa Base Día */}
        <div>
          <label htmlFor="tarifa_base_dia" className="block text-sm font-medium text-gray-700 mb-2">
            Tarifa Base por Día (S/.) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="tarifa_base_dia"
            name="tarifa_base_dia"
            value={formData.tarifa_base_dia}
            onChange={handleChange}
            step="0.01"
            min="0"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.tarifa_base_dia
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            placeholder="Ej: 50.00"
          />
          {errors.tarifa_base_dia && (
            <p className="text-red-500 text-sm mt-1">{errors.tarifa_base_dia}</p>
          )}
          <p className="text-sm text-gray-600 mt-1">
            Esta es la tarifa de referencia. Puede ajustarse al asignar el puesto a un trabajador.
          </p>
        </div>

        {/* Error de envío */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            <p className="text-sm">{submitError}</p>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex flex-col gap-3">
          {/* Botones principales (Guardar/Cancelar) */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting || isTogglingStatus}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || isTogglingStatus}
            >
              {isSubmitting ? 'Guardando...' : isEditMode ? 'Actualizar' : 'Crear'}
            </Button>
          </div>

          {/* Botón de baja lógica (solo en modo edición) */}
          {isEditMode && puesto && (
            <div className="pt-3 border-t border-gray-200">
              <Button
                type="button"
                onClick={handleToggleStatus}
                disabled={isSubmitting || isTogglingStatus}
                className={`w-full ${
                  puesto.es_activo
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isTogglingStatus
                  ? 'Procesando...'
                  : puesto.es_activo
                  ? '🔒 Dar de Baja (Desactivar)'
                  : '✅ Reactivar Puesto'}
              </Button>
              <p className="text-xs text-gray-600 mt-2 text-center">
                {puesto.es_activo
                  ? 'El puesto dejará de estar disponible para nuevas asignaciones'
                  : 'El puesto volverá a estar disponible para asignaciones'}
              </p>
            </div>
          )}
        </div>
      </form>
    </Modal>
  )
}
