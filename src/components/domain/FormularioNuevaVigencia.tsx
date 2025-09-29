import { useState, FormEvent } from 'react'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

interface FormularioNuevaVigenciaProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: NuevaVigenciaData) => void
}

interface NuevaVigenciaData {
  parametro: string
  nuevoValor: string
  fechaInicioVigencia: string
}

export default function FormularioNuevaVigencia({
  isOpen,
  onClose,
  onSave
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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      onSave(formData)
      handleReset()
      onClose()
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

  const parametrosDisponibles = [
    'RMV (Remuneración Mínima Vital)',
    'Tasa Bono BETA',
    'Gratificación Agraria',
    'CTS Agraria',
    'Asignación Familiar',
    'Horas Extras - Tasa 25%',
    'Horas Extras - Tasa 35%'
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Crear Nueva Vigencia de Parámetro"
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Selector de Parámetro */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Parámetro
          </label>
          <select
            value={formData.parametro}
            onChange={(e) => setFormData({ ...formData, parametro: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Seleccionar parámetro...</option>
            {parametrosDisponibles.map((param, index) => (
              <option key={index} value={param}>
                {param}
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
          type="text"
          placeholder="Ej: S/ 1,025.00 o 30% de la RMV"
          value={formData.nuevoValor}
          onChange={(e) => setFormData({ ...formData, nuevoValor: e.target.value })}
          error={errors.nuevoValor}
        />

        {/* Fecha de Inicio de Vigencia */}
        <Input
          label="Fecha de Inicio de Vigencia"
          type="date"
          value={formData.fechaInicioVigencia}
          onChange={(e) => setFormData({ ...formData, fechaInicioVigencia: e.target.value })}
          error={errors.fechaInicioVigencia}
          min={new Date().toISOString().split('T')[0]} // No permitir fechas pasadas
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
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
          >
            Guardar Vigencia
          </Button>
        </div>
      </form>
    </Modal>
  )
}