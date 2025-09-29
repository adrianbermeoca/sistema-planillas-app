import { useState, FormEvent, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

interface FormularioNuevaVigenciaProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: NuevaVigenciaData) => void
  isSaving: boolean
  modalError: string | null
}

interface NuevaVigenciaData {
  parametro: string
  nuevoValor: string
  fechaInicioVigencia: string
}

export default function FormularioNuevaVigencia({
  isOpen,
  onClose,
  onSave,
  isSaving,
  modalError
}: FormularioNuevaVigenciaProps) {
  const [formData, setFormData] = useState<NuevaVigenciaData>({
    parametro: '',
    nuevoValor: '',
    fechaInicioVigencia: ''
  })

  const [errors, setErrors] = useState<Partial<NuevaVigenciaData>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<NuevaVigenciaData> = {}

    if (!formData.parametro.trim()) {
      newErrors.parametro = 'El parámetro es requerido'
    }

    if (!formData.nuevoValor.trim()) {
      newErrors.nuevoValor = 'El nuevo valor es requerido'
    }

    if (!formData.fechaInicioVigencia) {
      newErrors.fechaInicioVigencia = 'La fecha de inicio de vigencia es requerida'
    } else {
      const fechaSeleccionada = new Date(formData.fechaInicioVigencia)
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0) // Remover horas para comparación

      if (fechaSeleccionada < hoy) {
        newErrors.fechaInicioVigencia = 'La fecha debe ser igual o posterior a hoy'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Resetear formulario cuando el modal se cierre
  useEffect(() => {
    if (!isOpen) {
      handleReset()
    }
  }, [isOpen])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      await onSave(formData)
      // El manejo del cierre lo hace la página padre
    }
  }

  const handleReset = () => {
    setFormData({
      parametro: '',
      nuevoValor: '',
      fechaInicioVigencia: ''
    })
    setErrors({})
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  // Parámetros disponibles según el enum de la BD
  const parametrosDisponibles = [
    { value: 'rmv', label: 'RMV (Remuneración Mínima Vital)' },
    { value: 'tasa_bono_beta', label: 'Tasa Bono BETA' },
    { value: 'tasa_gratificacion', label: 'Gratificación Agraria' },
    { value: 'tasa_cts', label: 'CTS Agraria' },
    { value: 'tasa_essalud_extra', label: 'Tasa EsSalud Extra' }
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Crear Nueva Vigencia de Parámetro"
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Mostrar error del modal */}
        {modalError && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error al guardar el parámetro
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  {modalError}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Selector de Parámetro */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Parámetro
          </label>
          <select
            value={formData.parametro}
            onChange={(e) => setFormData({ ...formData, parametro: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isSaving}
          >
            <option value="">Seleccionar parámetro...</option>
            {parametrosDisponibles.map((param) => (
              <option key={param.value} value={param.value}>
                {param.label}
              </option>
            ))}
          </select>
          {errors.parametro && (
            <p className="text-sm text-red-600 mt-1">{errors.parametro}</p>
          )}
        </div>

        {/* Nuevo Valor */}
        <Input
          label="Nuevo Valor"
          type="number"
          step="0.01"
          placeholder="Ej: 1025.00 para RMV o 30 para porcentajes"
          value={formData.nuevoValor}
          onChange={(e) => setFormData({ ...formData, nuevoValor: e.target.value })}
          error={errors.nuevoValor}
          disabled={isSaving}
        />

        {/* Fecha de Inicio de Vigencia */}
        <Input
          label="Fecha de Inicio de Vigencia"
          type="date"
          value={formData.fechaInicioVigencia}
          onChange={(e) => setFormData({ ...formData, fechaInicioVigencia: e.target.value })}
          error={errors.fechaInicioVigencia}
          min={new Date().toISOString().split('T')[0]}
          disabled={isSaving}
        />

        {/* Nota informativa */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Importante:</strong> La nueva vigencia entrará en efecto en la fecha
                especificada y será aplicada automáticamente a todas las planillas posteriores.
              </p>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            className="flex-1"
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={isSaving}
          >
            {isSaving ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Guardando...
              </div>
            ) : (
              'Guardar Vigencia'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}