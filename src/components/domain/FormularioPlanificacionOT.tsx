'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  getLabores,
  getSublotes,
  createOrdenDeTrabajo,
  type Labor,
  type Sublote,
  type OTLaborDetallePayload,
  type OrdenDeTrabajoPayload
} from '@/services/api'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

/**
 * Interfaz para los detalles de planificación en el formulario (estado local).
 * Incluye un ID temporal para manejar el estado del array.
 */
interface DetallePlanificacion {
  tempId: number
  labor_id: string | number
  sublote_id: string | number
  horas_estimadas: number | null
}

interface FormularioPlanificacionOTProps {
  onClose: () => void
  onSuccess: () => void
}

export default function FormularioPlanificacionOT({
  onClose,
  onSuccess
}: FormularioPlanificacionOTProps) {
  // Estados para catálogos
  const [labores, setLabores] = useState<Labor[]>([])
  const [sublotes, setSublotes] = useState<Sublote[]>([])
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true)
  const [errorCatalogos, setErrorCatalogos] = useState<string | null>(null)

  // Estados del formulario maestro (cabecera)
  const [descripcion, setDescripcion] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')

  // Estados del formulario detalle (labores/sublotes)
  const [detalles, setDetalles] = useState<DetallePlanificacion[]>([])
  const [nextTempId, setNextTempId] = useState(1)

  // Estados de envío
  const [guardando, setGuardando] = useState(false)
  const [errores, setErrores] = useState<Record<string, string>>({})

  // ========== CARGA DE CATÁLOGOS ==========
  useEffect(() => {
    async function cargarCatalogos() {
      setCargandoCatalogos(true)
      setErrorCatalogos(null)

      try {
        // Cargar labores activas
        const { data: laboresData, error: laboresError } = await getLabores(supabase, true)
        if (laboresError) {
          throw new Error(laboresError)
        }

        // Cargar sublotes
        const { data: sublotesData, error: sublotesError } = await getSublotes(supabase)
        if (sublotesError) {
          throw new Error(sublotesError)
        }

        setLabores(laboresData || [])
        setSublotes(sublotesData || [])
      } catch (err) {
        console.error('Error al cargar catálogos:', err)
        setErrorCatalogos(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setCargandoCatalogos(false)
      }
    }

    cargarCatalogos()
  }, [])

  // ========== MANEJO DE DETALLES (MAESTRO-DETALLE) ==========

  /**
   * Añade una nueva fila de detalle vacía al array.
   */
  const handleAgregarDetalle = () => {
    const nuevoDetalle: DetallePlanificacion = {
      tempId: nextTempId,
      labor_id: '',
      sublote_id: '',
      horas_estimadas: null
    }

    setDetalles([...detalles, nuevoDetalle])
    setNextTempId(nextTempId + 1)
  }

  /**
   * Elimina una fila de detalle por su ID temporal.
   */
  const handleEliminarDetalle = (tempId: number) => {
    setDetalles(detalles.filter(d => d.tempId !== tempId))
  }

  /**
   * Actualiza un campo específico de un detalle.
   */
  const handleCambioDetalle = (
    tempId: number,
    campo: keyof Omit<DetallePlanificacion, 'tempId'>,
    valor: string | number | null
  ) => {
    setDetalles(
      detalles.map(d =>
        d.tempId === tempId ? { ...d, [campo]: valor } : d
      )
    )
  }

  // ========== VALIDACIÓN Y ENVÍO ==========

  /**
   * Valida el formulario completo (cabecera + detalles).
   * Implementa RN-006-D: restricción de fechas.
   */
  const validarFormulario = (): boolean => {
    const nuevosErrores: Record<string, string> = {}

    // Validación de cabecera
    if (!descripcion.trim()) {
      nuevosErrores.descripcion = 'La descripción es obligatoria.'
    }

    if (!fechaInicio) {
      nuevosErrores.fechaInicio = 'La fecha de inicio es obligatoria.'
    } else {
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      const inicio = new Date(fechaInicio)

      // RN-006-D: No permitir fechas pasadas
      if (inicio < hoy) {
        nuevosErrores.fechaInicio = 'La fecha de inicio no puede ser anterior al día de hoy.'
      }
    }

    // Validación de rango de fechas
    if (fechaInicio && fechaFin) {
      const inicio = new Date(fechaInicio)
      const fin = new Date(fechaFin)

      if (fin < inicio) {
        nuevosErrores.fechaFin = 'La fecha de fin debe ser posterior o igual a la fecha de inicio.'
      }
    }

    // Validación de detalles
    if (detalles.length === 0) {
      nuevosErrores.detalles = 'Debe añadir al menos una labor/sublote a la planificación.'
    }

    // Validar cada detalle
    detalles.forEach((detalle, index) => {
      if (!detalle.labor_id) {
        nuevosErrores[`detalle_${detalle.tempId}_labor`] = `Labor obligatoria en fila ${index + 1}.`
      }
      if (!detalle.sublote_id) {
        nuevosErrores[`detalle_${detalle.tempId}_sublote`] = `Sublote obligatorio en fila ${index + 1}.`
      }
    })

    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  /**
   * Maneja el envío del formulario.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Limpiar errores previos
    setErrores({})

    // Validar formulario
    if (!validarFormulario()) {
      return
    }

    setGuardando(true)

    try {
      // Construir el payload
      const detallesPayload: OTLaborDetallePayload[] = detalles.map(d => ({
        labor_id: d.labor_id,
        sublote_id: d.sublote_id,
        horas_estimadas: d.horas_estimadas
      }))

      const payload: OrdenDeTrabajoPayload = {
        descripcion: descripcion.trim(),
        fecha_planificacion_inicio: fechaInicio,
        fecha_planificacion_fin: fechaFin || null,
        detalles: detallesPayload
      }

      console.log('Enviando payload de OT:', payload)

      // Llamar a la API
      const { data, error } = await createOrdenDeTrabajo(supabase, payload)

      if (error) {
        setErrores({ general: error })
        return
      }

      console.log('OT creada con éxito:', data)

      // Éxito: Notificar al componente padre
      alert('Orden de Trabajo creada exitosamente.')
      onSuccess()
      onClose()
    } catch (err) {
      console.error('Error inesperado al crear OT:', err)
      setErrores({ general: 'Error inesperado al guardar la orden de trabajo.' })
    } finally {
      setGuardando(false)
    }
  }

  // ========== RENDERIZADO ==========

  if (cargandoCatalogos) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Cargando catálogos...</p>
      </div>
    )
  }

  if (errorCatalogos) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-semibold">Error al cargar catálogos</h3>
        <p className="text-red-600 mt-2">{errorCatalogos}</p>
        <Button onClick={onClose} variant="secondary" className="mt-4">
          Cerrar
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error general */}
      {errores.general && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">{errores.general}</p>
        </div>
      )}

      {/* ===== SECCIÓN MAESTRO: CABECERA DE LA OT ===== */}
      <div className="border-b border-gray-200 pb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Datos de la Orden de Trabajo
        </h3>

        <div className="space-y-4">
          {/* Descripción */}
          <Input
            label="Descripción de la OT *"
            type="text"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            error={errores.descripcion}
            placeholder="Ej: Poda de mango - Lote A"
          />

          {/* Rango de fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Fecha de Inicio *"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              error={errores.fechaInicio}
            />

            <Input
              label="Fecha de Fin (Opcional)"
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              error={errores.fechaFin}
            />
          </div>
        </div>
      </div>

      {/* ===== SECCIÓN DETALLE: LABORES/SUBLOTES ===== */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Labores y Sublotes Planificados
          </h3>
          <Button
            type="button"
            onClick={handleAgregarDetalle}
            variant="secondary"
            disabled={labores.length === 0 || sublotes.length === 0}
          >
            + Añadir Labor
          </Button>
        </div>

        {/* Error de detalles */}
        {errores.detalles && (
          <p className="text-red-600 text-sm mb-4">{errores.detalles}</p>
        )}

        {/* Lista de detalles */}
        {detalles.length === 0 ? (
          <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-600">
            No hay labores añadidas. Haz clic en &quot;+ Añadir Labor&quot; para comenzar.
          </div>
        ) : (
          <div className="space-y-4">
            {detalles.map((detalle, index) => (
              <div
                key={detalle.tempId}
                className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-700">Detalle #{index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => handleEliminarDetalle(detalle.tempId)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Eliminar
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Selector de Labor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Labor *
                    </label>
                    <select
                      value={detalle.labor_id}
                      onChange={(e) =>
                        handleCambioDetalle(detalle.tempId, 'labor_id', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar labor...</option>
                      {labores.map((labor) => (
                        <option key={labor.id} value={labor.id}>
                          {labor.nombre_labor} ({labor.metodo_pago})
                        </option>
                      ))}
                    </select>
                    {errores[`detalle_${detalle.tempId}_labor`] && (
                      <p className="text-red-600 text-xs mt-1">
                        {errores[`detalle_${detalle.tempId}_labor`]}
                      </p>
                    )}
                  </div>

                  {/* Selector de Sublote */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sublote *
                    </label>
                    <select
                      value={detalle.sublote_id}
                      onChange={(e) =>
                        handleCambioDetalle(detalle.tempId, 'sublote_id', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar sublote...</option>
                      {sublotes.map((sublote) => (
                        <option key={sublote.id} value={sublote.id}>
                          {sublote.nombre}
                          {sublote.es_proyecto && ' (Proyecto)'}
                        </option>
                      ))}
                    </select>
                    {errores[`detalle_${detalle.tempId}_sublote`] && (
                      <p className="text-red-600 text-xs mt-1">
                        {errores[`detalle_${detalle.tempId}_sublote`]}
                      </p>
                    )}
                  </div>

                  {/* Horas estimadas */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Horas Estimadas (Opcional)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={detalle.horas_estimadas || ''}
                      onChange={(e) =>
                        handleCambioDetalle(
                          detalle.tempId,
                          'horas_estimadas',
                          e.target.value ? parseFloat(e.target.value) : null
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="8.0"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== BOTONES DE ACCIÓN ===== */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <Button type="button" onClick={onClose} variant="secondary" disabled={guardando}>
          Cancelar
        </Button>
        <Button type="submit" disabled={guardando || detalles.length === 0}>
          {guardando ? 'Guardando...' : 'Crear Orden de Trabajo'}
        </Button>
      </div>
    </form>
  )
}
