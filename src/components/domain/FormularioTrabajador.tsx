'use client'

import { useState, FormEvent } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { createTrabajador, type TrabajadorInsert } from '@/services/api'
import { createClient } from '@/lib/supabase/client'

interface FormularioTrabajadorProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export default function FormularioTrabajador({ onSuccess, onCancel }: FormularioTrabajadorProps) {
  const [formData, setFormData] = useState({
    nombre_completo: '',
    dni: '',
    fecha_ingreso: '',
    modalidad_principal: 'planilla' as 'planilla' | 'rh' | 'eventual'
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    nombre_completo?: string
    dni?: string
    fecha_ingreso?: string
  }>({})

  // Validación de fecha: no puede ser posterior a hoy
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0]
  }

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

    if (!formData.fecha_ingreso) {
      errors.fecha_ingreso = 'La fecha de ingreso es requerida'
    } else if (new Date(formData.fecha_ingreso) > new Date()) {
      errors.fecha_ingreso = 'La fecha de ingreso no puede ser posterior a hoy'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
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

      const newWorkerData: Omit<TrabajadorInsert, 'id' | 'created_at'> = {
        nombre_completo: formData.nombre_completo.trim(),
        dni: formData.dni.trim(),
        modalidad_principal: formData.modalidad_principal
      }

      await createTrabajador(supabase, newWorkerData)

      // Éxito: mostrar mensaje y limpiar formulario
      alert('Trabajador registrado exitosamente')

      // Limpiar formulario
      setFormData({
        nombre_completo: '',
        dni: '',
        fecha_ingreso: '',
        modalidad_principal: 'planilla'
      })

      // Callback de éxito (si existe)
      if (onSuccess) {
        onSuccess()
      }

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Ocurrió un error inesperado al registrar el trabajador')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error general del formulario */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p className="font-medium">Error al registrar trabajador:</p>
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

      {/* Campo: Fecha de Ingreso */}
      <Input
        label="Fecha de Ingreso *"
        type="date"
        value={formData.fecha_ingreso}
        onChange={(e) => setFormData({ ...formData, fecha_ingreso: e.target.value })}
        error={fieldErrors.fecha_ingreso}
        disabled={loading}
        max={getTodayDate()}
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

      {/* Botones de acción */}
      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className="flex-1"
        >
          {loading ? 'Registrando...' : 'Registrar Trabajador'}
        </Button>

        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
        )}
      </div>

      {/* Nota informativa */}
      <p className="text-xs text-gray-500 pt-2">
        * Campos obligatorios
      </p>
    </form>
  )
}
