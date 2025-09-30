'use client'

import { useState, useEffect, FormEvent } from 'react'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import {
  updateTrabajador,
  toggleTrabajadorStatus,
  type Trabajador,
  type TrabajadorUpdate
} from '@/services/api'
import { createClient } from '@/lib/supabase/client'

interface ModalEdicionTrabajadorProps {
  isOpen: boolean
  onClose: () => void
  trabajador: Trabajador
  onSuccess?: () => void
}

export default function ModalEdicionTrabajador({
  isOpen,
  onClose,
  trabajador,
  onSuccess
}: ModalEdicionTrabajadorProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Estados del formulario (inicializados con los datos del trabajador)
  const [formData, setFormData] = useState({
    nombre_completo: trabajador.nombre_completo,
    dni: trabajador.dni,
    modalidad_principal: trabajador.modalidad_principal as 'planilla' | 'rh' | 'eventual'
  })

  const [fieldErrors, setFieldErrors] = useState<{
    nombre_completo?: string
    dni?: string
  }>({})

  // Resetear formulario cuando el trabajador cambie o el modal se abra
  useEffect(() => {
    if (isOpen) {
      setFormData({
        nombre_completo: trabajador.nombre_completo,
        dni: trabajador.dni,
        modalidad_principal: trabajador.modalidad_principal as 'planilla' | 'rh' | 'eventual'
      })
      setError(null)
      setFieldErrors({})
    }
  }, [isOpen, trabajador])

  // Validación del formulario
  const validateForm = (): boolean => {
    const errors: typeof fieldErrors = {}

    if (!formData.nombre_completo.trim()) {
      errors.nombre_completo = 'El nombre completo es requerido'
    }

    if (!formData.dni.trim()) {
      errors.dni = 'El DNI es requerido'
    } else if (!/^\d{8}$/.test(formData.dni)) {
      errors.dni = 'El DNI debe tener exactamente 8 dígitos'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Manejo de actualización del trabajador
  const handleUpdate = async (e: FormEvent<HTMLFormElement>) => {
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

      // Construir payload con solo los campos modificados
      const updateData: Partial<TrabajadorUpdate> = {}

      if (formData.nombre_completo !== trabajador.nombre_completo) {
        updateData.nombre_completo = formData.nombre_completo.trim()
      }

      if (formData.dni !== trabajador.dni) {
        updateData.dni = formData.dni.trim()
      }

      if (formData.modalidad_principal !== trabajador.modalidad_principal) {
        updateData.modalidad_principal = formData.modalidad_principal
      }

      // Si no hay cambios, mostrar mensaje
      if (Object.keys(updateData).length === 0) {
        alert('No se detectaron cambios para guardar')
        return
      }

      // Llamar a la API
      const { data, error } = await updateTrabajador(supabase, trabajador.id, updateData)

      if (error) {
        setError(error)
        return
      }

      // Éxito
      alert('Trabajador actualizado exitosamente')

      // Callback de éxito
      if (onSuccess) {
        onSuccess()
      }

      // Cerrar modal
      onClose()

    } catch (err) {
      console.error('Error al actualizar trabajador:', err)
      setError(err instanceof Error ? err.message : 'Error inesperado al actualizar el trabajador')
    } finally {
      setLoading(false)
    }
  }

  // Manejo de baja lógica (dar de baja)
  const handleToggleStatus = async (nuevoEstado: boolean) => {
    const accion = nuevoEstado ? 'activar' : 'dar de baja'
    const confirmacion = confirm(
      `¿Está seguro de ${accion} a ${trabajador.nombre_completo}?\n\n` +
      `Esto ${nuevoEstado ? 'activará' : 'desactivará'} todas las asignaciones de puesto de este trabajador.`
    )

    if (!confirmacion) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data, error } = await toggleTrabajadorStatus(supabase, trabajador.id, nuevoEstado)

      if (error) {
        setError(error)
        return
      }

      // Éxito
      alert(`Trabajador ${nuevoEstado ? 'activado' : 'dado de baja'} exitosamente`)

      // Callback de éxito
      if (onSuccess) {
        onSuccess()
      }

      // Cerrar modal
      onClose()

    } catch (err) {
      console.error('Error al cambiar estado del trabajador:', err)
      setError(err instanceof Error ? err.message : 'Error inesperado al cambiar el estado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Editar Trabajador: ${trabajador.nombre_completo}`}
      className="max-w-2xl"
    >
      {/* Información del trabajador */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">ID:</span> {trabajador.id}
        </p>
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Fecha de Registro:</span>{' '}
          {new Date(trabajador.created_at).toLocaleDateString('es-PE')}
        </p>
      </div>

      {/* Formulario de edición */}
      <form onSubmit={handleUpdate} className="space-y-4">
        {/* Error general del formulario */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            <p className="font-medium">Error:</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Campo: Nombre Completo */}
        <Input
          label="Nombre Completo *"
          type="text"
          value={formData.nombre_completo}
          onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
          error={fieldErrors.nombre_completo}
          disabled={loading}
          placeholder="Ej: Juan Pérez García"
          required
        />

        {/* Campo: DNI */}
        <Input
          label="DNI *"
          type="text"
          value={formData.dni}
          onChange={(e) => {
            // Solo permitir números y máximo 8 caracteres
            const value = e.target.value.replace(/\D/g, '').slice(0, 8)
            setFormData({ ...formData, dni: value })
          }}
          error={fieldErrors.dni}
          disabled={loading}
          placeholder="Ej: 12345678"
          maxLength={8}
          required
        />

        {/* Campo: Modalidad Principal */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Modalidad Laboral *
          </label>
          <select
            value={formData.modalidad_principal}
            onChange={(e) => setFormData({
              ...formData,
              modalidad_principal: e.target.value as 'planilla' | 'rh' | 'eventual'
            })}
            disabled={loading}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="planilla">Planilla (Ley 31110)</option>
            <option value="rh">Recursos Humanos (RH)</option>
            <option value="eventual">Eventual</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Seleccione el régimen laboral del trabajador
          </p>
        </div>

        {/* Botones de acción del formulario */}
        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
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
          * Campos obligatorios
        </p>
      </form>

      {/* Sección de baja lógica (separada del formulario) */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">
          Gestión de Estado del Trabajador
        </h4>

        <p className="text-sm text-gray-600 mb-4">
          La baja lógica desactiva todas las asignaciones de puesto de este trabajador sin eliminar sus registros históricos.
        </p>

        <div className="flex gap-3">
          <Button
            type="button"
            onClick={() => handleToggleStatus(false)}
            disabled={loading}
            className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
          >
            🚫 Dar de Baja
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={() => handleToggleStatus(true)}
            disabled={loading}
          >
            ✅ Activar Trabajador
          </Button>
        </div>

        <p className="text-xs text-gray-500 mt-3">
          <strong>Nota:</strong> La baja lógica afecta el campo <code>es_activo</code> en las asignaciones de puesto del trabajador.
        </p>
      </div>
    </Modal>
  )
}
