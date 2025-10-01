'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  createLabor,
  updateLabor,
  toggleLaborStatus,
  type Labor
} from '@/services/api'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface ModalLaborFormProps {
  labor: Labor | null // null para crear, Labor para editar
  onClose: () => void
  onSuccess: () => void
}

export default function ModalLaborForm({
  labor,
  onClose,
  onSuccess
}: ModalLaborFormProps) {
  const esEdicion = labor !== null

  // Estados del formulario
  const [nombreLabor, setNombreLabor] = useState('')
  const [metodoPago, setMetodoPago] = useState<'PorTiempo' | 'PorDestajo'>('PorTiempo')
  const [indicadorDestajo, setIndicadorDestajo] = useState('')
  const [tarifaDestajo, setTarifaDestajo] = useState('0')
  const [esLaborGenerica, setEsLaborGenerica] = useState(false)

  // Estados de control
  const [guardando, setGuardando] = useState(false)
  const [errores, setErrores] = useState<Record<string, string>>({})

  // Pre-cargar datos si es edición
  useEffect(() => {
    if (esEdicion && labor) {
      setNombreLabor(labor.nombre_labor)
      setMetodoPago(labor.metodo_pago)
      setIndicadorDestajo(labor.indicador_destajo || '')
      setTarifaDestajo(labor.tarifa_destajo.toString())
      setEsLaborGenerica(labor.es_labor_generica)
    }
  }, [esEdicion, labor])

  // Validación del formulario
  const validarFormulario = (): boolean => {
    const nuevosErrores: Record<string, string> = {}

    if (!nombreLabor.trim()) {
      nuevosErrores.nombreLabor = 'El nombre de la labor es obligatorio.'
    }

    // Si es por destajo, validar campos adicionales
    if (metodoPago === 'PorDestajo') {
      if (!indicadorDestajo.trim()) {
        nuevosErrores.indicadorDestajo = 'El indicador de destajo es obligatorio (ej: kg, m², plantas).'
      }
      const tarifa = parseFloat(tarifaDestajo)
      if (isNaN(tarifa) || tarifa <= 0) {
        nuevosErrores.tarifaDestajo = 'La tarifa de destajo debe ser mayor a 0.'
      }
    }

    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  // Handler de envío
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validarFormulario()) {
      return
    }

    setGuardando(true)
    setErrores({})

    try {
      const laborData = {
        nombre_labor: nombreLabor.trim(),
        metodo_pago: metodoPago,
        indicador_destajo: metodoPago === 'PorDestajo' ? indicadorDestajo.trim() : null,
        tarifa_destajo: parseFloat(tarifaDestajo),
        es_labor_generica: esLaborGenerica
      }

      let result

      if (esEdicion && labor) {
        // Actualizar labor existente
        result = await updateLabor(supabase, labor.id, laborData)
      } else {
        // Crear nueva labor
        result = await createLabor(supabase, laborData)
      }

      if (result.error) {
        setErrores({ general: result.error })
        return
      }

      alert(esEdicion ? 'Labor actualizada exitosamente.' : 'Labor creada exitosamente.')
      onSuccess()
      onClose()
    } catch (err) {
      console.error('Error inesperado:', err)
      setErrores({ general: 'Error inesperado al guardar la labor.' })
    } finally {
      setGuardando(false)
    }
  }

  // Handler de cambio de estado (baja lógica)
  const handleToggleStatus = async () => {
    if (!esEdicion || !labor) return

    const nuevoEstado = !labor.es_activo
    const confirmar = window.confirm(
      `¿Confirmas que deseas ${nuevoEstado ? 'activar' : 'desactivar'} esta labor?`
    )

    if (!confirmar) return

    setGuardando(true)

    try {
      const { error } = await toggleLaborStatus(supabase, labor.id, nuevoEstado)

      if (error) {
        setErrores({ general: error })
        return
      }

      alert(`Labor ${nuevoEstado ? 'activada' : 'desactivada'} exitosamente.`)
      onSuccess()
      onClose()
    } catch (err) {
      console.error('Error al cambiar estado:', err)
      setErrores({ general: 'Error inesperado al cambiar el estado de la labor.' })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error general */}
      {errores.general && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">{errores.general}</p>
        </div>
      )}

      {/* Nombre de la labor */}
      <Input
        label="Nombre de la Labor *"
        type="text"
        value={nombreLabor}
        onChange={(e) => setNombreLabor(e.target.value)}
        error={errores.nombreLabor}
        placeholder="Ej: Poda de Formación"
      />

      {/* Método de pago */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Método de Pago *
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              value="PorTiempo"
              checked={metodoPago === 'PorTiempo'}
              onChange={(e) => setMetodoPago(e.target.value as 'PorTiempo' | 'PorDestajo')}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Por Tiempo (Horas)</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="PorDestajo"
              checked={metodoPago === 'PorDestajo'}
              onChange={(e) => setMetodoPago(e.target.value as 'PorTiempo' | 'PorDestajo')}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Por Destajo (Avance)</span>
          </label>
        </div>
      </div>

      {/* Campos específicos para destajo */}
      {metodoPago === 'PorDestajo' && (
        <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900">Configuración de Destajo</h4>

          <Input
            label="Indicador de Destajo (Unidad) *"
            type="text"
            value={indicadorDestajo}
            onChange={(e) => setIndicadorDestajo(e.target.value)}
            error={errores.indicadorDestajo}
            placeholder="Ej: kg, m², plantas, sacos"
          />

          <Input
            label="Tarifa por Unidad (S/) *"
            type="number"
            step="0.01"
            min="0"
            value={tarifaDestajo}
            onChange={(e) => setTarifaDestajo(e.target.value)}
            error={errores.tarifaDestajo}
            placeholder="Ej: 0.50"
          />
        </div>
      )}

      {/* Labor genérica */}
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id="esLaborGenerica"
            type="checkbox"
            checked={esLaborGenerica}
            onChange={(e) => setEsLaborGenerica(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>
        <div className="ml-3">
          <label htmlFor="esLaborGenerica" className="text-sm font-medium text-gray-700">
            Labor Genérica (No productiva)
          </label>
          <p className="text-xs text-gray-500 mt-1">
            Marcar si esta labor se imputa a gastos indirectos (ej: Descansos, Faltas, Capacitación)
          </p>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        {/* Botón de baja lógica (solo en edición) */}
        {esEdicion && labor && (
          <Button
            type="button"
            onClick={handleToggleStatus}
            variant="secondary"
            disabled={guardando}
          >
            {labor.es_activo ? 'Desactivar Labor' : 'Activar Labor'}
          </Button>
        )}

        {/* Botones de cancelar y guardar */}
        <div className={`flex items-center gap-3 ${!esEdicion ? 'ml-auto' : ''}`}>
          <Button type="button" onClick={onClose} variant="secondary" disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" disabled={guardando}>
            {guardando ? 'Guardando...' : esEdicion ? 'Actualizar Labor' : 'Crear Labor'}
          </Button>
        </div>
      </div>
    </form>
  )
}
