'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  getTrabajadoresParaTareo,
  getLabores,
  getSublotes,
  getOrdenesDeTrabajo,
  createParteDiario,
  type Trabajador,
  type Labor,
  type Sublote,
  type OrdenDeTrabajo,
  type TareoDetallePayload,
  type ParteDiarioCompletoPayload
} from '@/services/api'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

/**
 * Interfaz para el estado local de cada fila de detalle del tareo.
 * Incluye un ID temporal para gestión del array.
 */
interface FilaTareoDetalle {
  tempId: number
  trabajador_id: string | number
  labor_id: string | number
  sublote_id: string | number
  horas_imputadas: number | null
  horas_extras: number | null
  unidad_avance: number | null
  factor_ajuste_dia: number | null
  bonificacion_operacional: number | null
}

interface FormularioCapturaTareoProps {
  onClose: () => void
  onSuccess: () => void
}

export default function FormularioCapturaTareo({
  onClose,
  onSuccess
}: FormularioCapturaTareoProps) {
  // ========== ESTADOS DE CATÁLOGOS ==========
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([])
  const [labores, setLabores] = useState<Labor[]>([])
  const [sublotes, setSublotes] = useState<Sublote[]>([])
  const [ordenesDelDia, setOrdenesDelDia] = useState<OrdenDeTrabajo[]>([])
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true)
  const [errorCatalogos, setErrorCatalogos] = useState<string | null>(null)

  // ========== ESTADOS DE FORMULARIO MAESTRO ==========
  const [fechaParte, setFechaParte] = useState('')
  const [supervisorId] = useState<number | null>(null) // Placeholder hasta autenticación

  // ========== ESTADOS DE DETALLES ==========
  const [detalles, setDetalles] = useState<FilaTareoDetalle[]>([])
  const [nextTempId, setNextTempId] = useState(1)

  // ========== ESTADOS DE ENVÍO ==========
  const [guardando, setGuardando] = useState(false)
  const [errores, setErrores] = useState<Record<string, string>>({})

  // ========== CARGA DE CATÁLOGOS ==========

  useEffect(() => {
    async function cargarCatalogos() {
      setCargandoCatalogos(true)
      setErrorCatalogos(null)

      try {
        // Cargar en paralelo todos los catálogos necesarios
        const [trabajadoresRes, laboresRes, sublotesRes, ordenesRes] = await Promise.all([
          getTrabajadoresParaTareo(supabase),
          getLabores(supabase, true), // Solo activas
          getSublotes(supabase),
          getOrdenesDeTrabajo(supabase)
        ])

        // Validar respuestas
        if (trabajadoresRes.error) throw new Error(trabajadoresRes.error)
        if (laboresRes.error) throw new Error(laboresRes.error)
        if (sublotesRes.error) throw new Error(sublotesRes.error)
        if (ordenesRes.error) throw new Error(ordenesRes.error)

        setTrabajadores(trabajadoresRes.data || [])
        setLabores(laboresRes.data || [])
        setSublotes(sublotesRes.data || [])
        setOrdenesDelDia(ordenesRes.data || [])
      } catch (err) {
        console.error('Error al cargar catálogos:', err)
        setErrorCatalogos(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setCargandoCatalogos(false)
      }
    }

    cargarCatalogos()
  }, [])

  // ========== FILTRADO DE ÓRDENES POR FECHA ==========

  /**
   * Filtra las OTs que están activas para la fecha seleccionada.
   * Implementa RN-006-E (sugerencia de captura basada en planificación).
   */
  const ordenesParaFecha = ordenesDelDia.filter(orden => {
    if (!fechaParte) return false

    const fechaSeleccionada = new Date(fechaParte)
    const fechaInicio = new Date(orden.fecha_planificacion_inicio)
    const fechaFin = orden.fecha_planificacion_fin ? new Date(orden.fecha_planificacion_fin) : null

    // La OT es válida si la fecha está en el rango planificado
    if (fechaFin) {
      return fechaSeleccionada >= fechaInicio && fechaSeleccionada <= fechaFin
    } else {
      return fechaSeleccionada >= fechaInicio
    }
  })

  // ========== MANEJO DE DETALLES (MAESTRO-DETALLE) ==========

  /**
   * Añade una nueva fila vacía de detalle.
   */
  const handleAgregarFila = () => {
    const nuevaFila: FilaTareoDetalle = {
      tempId: nextTempId,
      trabajador_id: '',
      labor_id: '',
      sublote_id: '',
      horas_imputadas: null,
      horas_extras: null,
      unidad_avance: null,
      factor_ajuste_dia: null,
      bonificacion_operacional: null
    }

    setDetalles([...detalles, nuevaFila])
    setNextTempId(nextTempId + 1)
  }

  /**
   * Elimina una fila de detalle por su ID temporal.
   */
  const handleEliminarFila = (tempId: number) => {
    setDetalles(detalles.filter(d => d.tempId !== tempId))
  }

  /**
   * Actualiza un campo específico de una fila de detalle.
   * Implementa la lógica adaptativa RN-004-A/B.
   */
  const handleCambioDetalle = (
    tempId: number,
    campo: keyof Omit<FilaTareoDetalle, 'tempId'>,
    valor: string | number | null
  ) => {
    setDetalles(
      detalles.map(d => {
        if (d.tempId !== tempId) return d

        const actualizado = { ...d, [campo]: valor }

        // LÓGICA ADAPTATIVA: Si cambia la labor, resetear campos de captura
        if (campo === 'labor_id') {
          const laborSeleccionada = labores.find(l => l.id.toString() === valor?.toString())

          if (laborSeleccionada) {
            // Si es PorTiempo, resetear avance y habilitar horas
            if (laborSeleccionada.metodo_pago === 'PorTiempo') {
              actualizado.unidad_avance = null
            }
            // Si es PorDestajo, resetear horas y habilitar avance
            else if (laborSeleccionada.metodo_pago === 'PorDestajo') {
              actualizado.horas_imputadas = null
              actualizado.horas_extras = null
            }
          }
        }

        return actualizado
      })
    )
  }

  // ========== OBTENCIÓN DE LABOR SELECCIONADA ==========

  /**
   * Helper para obtener la labor seleccionada de una fila.
   */
  const getLaborDeDetalle = (detalle: FilaTareoDetalle): Labor | undefined => {
    if (!detalle.labor_id) return undefined
    return labores.find(l => l.id.toString() === detalle.labor_id.toString())
  }

  // ========== VALIDACIÓN Y ENVÍO ==========

  /**
   * Valida el formulario completo antes del envío.
   * Implementa RN-006-D (no futuras) y RN-004-A/B (horas O avance).
   */
  const validarFormulario = (): boolean => {
    const nuevosErrores: Record<string, string> = {}

    // Validación de fecha
    if (!fechaParte) {
      nuevosErrores.fechaParte = 'La fecha del parte es obligatoria.'
    } else {
      // RN-006-D: No permitir fechas futuras
      const fechaSeleccionada = new Date(fechaParte)
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      fechaSeleccionada.setHours(0, 0, 0, 0)

      if (fechaSeleccionada > hoy) {
        nuevosErrores.fechaParte = 'No se puede registrar un parte diario para una fecha futura (RN-006-D).'
      }
    }

    // Validación de detalles
    if (detalles.length === 0) {
      nuevosErrores.detalles = 'Debe añadir al menos un registro de trabajo.'
    }

    // Validar cada fila de detalle
    detalles.forEach((detalle, index) => {
      const prefix = `detalle_${detalle.tempId}`

      if (!detalle.trabajador_id) {
        nuevosErrores[`${prefix}_trabajador`] = `Fila ${index + 1}: Trabajador obligatorio.`
      }
      if (!detalle.labor_id) {
        nuevosErrores[`${prefix}_labor`] = `Fila ${index + 1}: Labor obligatoria.`
      }
      if (!detalle.sublote_id) {
        nuevosErrores[`${prefix}_sublote`] = `Fila ${index + 1}: Sublote obligatorio.`
      }

      // RN-004-A/B: Validar que tenga horas O avance (no ambos vacíos)
      const labor = getLaborDeDetalle(detalle)

      if (labor) {
        if (labor.metodo_pago === 'PorTiempo') {
          // Si es por tiempo, debe tener horas imputadas
          if (!detalle.horas_imputadas || detalle.horas_imputadas <= 0) {
            nuevosErrores[`${prefix}_horas`] = `Fila ${index + 1}: Horas imputadas obligatorias para labor por tiempo.`
          }
        } else if (labor.metodo_pago === 'PorDestajo') {
          // Si es por destajo, debe tener unidad de avance
          if (!detalle.unidad_avance || detalle.unidad_avance <= 0) {
            nuevosErrores[`${prefix}_avance`] = `Fila ${index + 1}: Unidad de avance obligatoria para labor por destajo.`
          }
        }
      }
    })

    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  /**
   * Maneja el envío del formulario al API.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Limpiar errores previos
    setErrores({})

    // Validar
    if (!validarFormulario()) {
      return
    }

    setGuardando(true)

    try {
      // Construir payload de detalles
      const detallesPayload: TareoDetallePayload[] = detalles.map(d => ({
        trabajador_id: d.trabajador_id,
        labor_id: d.labor_id,
        sublote_id: d.sublote_id,
        horas_imputadas: d.horas_imputadas,
        horas_extras: d.horas_extras,
        unidad_avance: d.unidad_avance,
        factor_ajuste_dia: d.factor_ajuste_dia,
        bonificacion_operacional: d.bonificacion_operacional
      }))

      // Construir payload completo
      const payload: ParteDiarioCompletoPayload = {
        fecha_parte: fechaParte,
        supervisor_id: supervisorId,
        detalles: detallesPayload
      }

      console.log('Enviando parte diario:', payload)

      // Llamar a la API
      const { data, error } = await createParteDiario(supabase, payload)

      if (error) {
        setErrores({ general: error })
        return
      }

      console.log('Parte diario creado con éxito:', data)

      alert(`Parte diario registrado exitosamente con ${data?.detalles.length} detalles.`)
      onSuccess()
      onClose()
    } catch (err) {
      console.error('Error inesperado al crear parte diario:', err)
      setErrores({ general: 'Error inesperado al guardar el parte diario.' })
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

      {/* ===== SECCIÓN MAESTRO: CABECERA DEL PARTE ===== */}
      <div className="border-b border-gray-200 pb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Datos del Parte Diario
        </h3>

        <div className="space-y-4">
          {/* Fecha del parte */}
          <Input
            label="Fecha del Parte *"
            type="date"
            value={fechaParte}
            onChange={(e) => setFechaParte(e.target.value)}
            error={errores.fechaParte}
          />

          {/* Órdenes de Trabajo para la fecha (RN-006-E) */}
          {fechaParte && ordenesParaFecha.length > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                📋 Órdenes Planificadas para este día ({ordenesParaFecha.length})
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                {ordenesParaFecha.map(orden => (
                  <li key={orden.id}>
                    • OT #{orden.id}: {orden.descripcion}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-blue-700 mt-2">
                Sugerencia: Registra las labores planificadas en estas órdenes de trabajo.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ===== SECCIÓN DETALLE: REGISTRO DE TRABAJO ===== */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Registro de Trabajo Realizado
          </h3>
          <Button
            type="button"
            onClick={handleAgregarFila}
            variant="secondary"
            disabled={!fechaParte || trabajadores.length === 0}
          >
            + Añadir Trabajador/Labor
          </Button>
        </div>

        {/* Error de detalles */}
        {errores.detalles && (
          <p className="text-red-600 text-sm mb-4">{errores.detalles}</p>
        )}

        {/* Lista de detalles */}
        {detalles.length === 0 ? (
          <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-600">
            No hay registros de trabajo. Selecciona una fecha y haz clic en &quot;+ Añadir Trabajador/Labor&quot;.
          </div>
        ) : (
          <div className="space-y-4">
            {detalles.map((detalle, index) => {
              const labor = getLaborDeDetalle(detalle)
              const esPorTiempo = labor?.metodo_pago === 'PorTiempo'
              const esPorDestajo = labor?.metodo_pago === 'PorDestajo'

              return (
                <div
                  key={detalle.tempId}
                  className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3"
                >
                  {/* Header de la fila */}
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-700">Registro #{index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => handleEliminarFila(detalle.tempId)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Eliminar
                    </button>
                  </div>

                  {/* Selectores principales */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Trabajador */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Trabajador *
                      </label>
                      <select
                        value={detalle.trabajador_id}
                        onChange={(e) =>
                          handleCambioDetalle(detalle.tempId, 'trabajador_id', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Seleccionar...</option>
                        {trabajadores.map((trabajador) => (
                          <option key={trabajador.id} value={trabajador.id}>
                            {trabajador.nombre_completo} - {trabajador.modalidad_principal}
                          </option>
                        ))}
                      </select>
                      {errores[`detalle_${detalle.tempId}_trabajador`] && (
                        <p className="text-red-600 text-xs mt-1">
                          {errores[`detalle_${detalle.tempId}_trabajador`]}
                        </p>
                      )}
                    </div>

                    {/* Labor */}
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
                        <option value="">Seleccionar...</option>
                        {labores.map((labor) => (
                          <option key={labor.id} value={labor.id}>
                            {labor.nombre_labor} ({labor.metodo_pago === 'PorTiempo' ? 'Tiempo' : 'Destajo'})
                          </option>
                        ))}
                      </select>
                      {errores[`detalle_${detalle.tempId}_labor`] && (
                        <p className="text-red-600 text-xs mt-1">
                          {errores[`detalle_${detalle.tempId}_labor`]}
                        </p>
                      )}
                    </div>

                    {/* Sublote */}
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
                        <option value="">Seleccionar...</option>
                        {sublotes.map((sublote) => (
                          <option key={sublote.id} value={sublote.id}>
                            {sublote.nombre}
                          </option>
                        ))}
                      </select>
                      {errores[`detalle_${detalle.tempId}_sublote`] && (
                        <p className="text-red-600 text-xs mt-1">
                          {errores[`detalle_${detalle.tempId}_sublote`]}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* SECCIÓN ADAPTATIVA: Tiempo vs Destajo (RN-004-A/B) */}
                  {labor && (
                    <div className="p-3 bg-white border border-gray-300 rounded-md">
                      <h5 className="text-sm font-medium text-gray-700 mb-3">
                        Captura de {esPorTiempo ? 'Tiempo' : 'Destajo'}
                      </h5>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* MODO TIEMPO */}
                        {esPorTiempo && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Horas Imputadas * (RN-004-B)
                              </label>
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                max="24"
                                value={detalle.horas_imputadas || ''}
                                onChange={(e) =>
                                  handleCambioDetalle(
                                    detalle.tempId,
                                    'horas_imputadas',
                                    e.target.value ? parseFloat(e.target.value) : null
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="8.0"
                              />
                              {errores[`detalle_${detalle.tempId}_horas`] && (
                                <p className="text-red-600 text-xs mt-1">
                                  {errores[`detalle_${detalle.tempId}_horas`]}
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Horas Extras (Opcional)
                              </label>
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                value={detalle.horas_extras || ''}
                                onChange={(e) =>
                                  handleCambioDetalle(
                                    detalle.tempId,
                                    'horas_extras',
                                    e.target.value ? parseFloat(e.target.value) : null
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0.0"
                              />
                            </div>
                          </>
                        )}

                        {/* MODO DESTAJO */}
                        {esPorDestajo && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Unidad Avance ({labor.indicador_destajo || 'unidades'}) * (RN-004-A)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={detalle.unidad_avance || ''}
                              onChange={(e) =>
                                handleCambioDetalle(
                                  detalle.tempId,
                                  'unidad_avance',
                                  e.target.value ? parseFloat(e.target.value) : null
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="100"
                            />
                            {errores[`detalle_${detalle.tempId}_avance`] && (
                              <p className="text-red-600 text-xs mt-1">
                                {errores[`detalle_${detalle.tempId}_avance`]}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Factor de Ajuste (RN-004-D) */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Factor Ajuste Día (%) - RN-004-D
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={detalle.factor_ajuste_dia || ''}
                            onChange={(e) =>
                              handleCambioDetalle(
                                detalle.tempId,
                                'factor_ajuste_dia',
                                e.target.value ? parseFloat(e.target.value) : null
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="100 (feriado: 200)"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Ej: 100% normal, 200% feriado
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ===== BOTONES DE ACCIÓN ===== */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <Button type="button" onClick={onClose} variant="secondary" disabled={guardando}>
          Cancelar
        </Button>
        <Button type="submit" disabled={guardando || detalles.length === 0 || !fechaParte}>
          {guardando ? 'Guardando...' : 'Registrar Parte Diario'}
        </Button>
      </div>
    </form>
  )
}
