'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  getParteDiarioPorFecha,
  updateParteDiarioStatus,
  getTrabajadoresParaTareo,
  getLabores,
  getSublotes,
  type ParteDiarioCompleto,
  type TareoDetalle,
  type Trabajador,
  type Labor,
  type Sublote
} from '@/services/api'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import FormularioCapturaTareo from '@/components/domain/FormularioCapturaTareo'

/**
 * Badge para mostrar el estado del parte diario.
 * Estados según enum: Pendiente, Aprobado, Rechazado
 */
function EstadoBadge({ estado }: { estado: 'Pendiente' | 'Aprobado' | 'Rechazado' }) {
  const estilos: Record<string, string> = {
    Pendiente: 'bg-yellow-100 text-yellow-800',
    Aprobado: 'bg-green-100 text-green-800',
    Rechazado: 'bg-red-100 text-red-800'
  }

  const clase = estilos[estado] || 'bg-gray-100 text-gray-800'

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${clase}`}>
      {estado}
    </span>
  )
}

/**
 * Formatea una fecha ISO a DD/MM/YYYY.
 */
function formatearFecha(fechaISO: string): string {
  try {
    const fecha = new Date(fechaISO)
    const dia = fecha.getDate().toString().padStart(2, '0')
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0')
    const anio = fecha.getFullYear()
    return `${dia}/${mes}/${anio}`
  } catch {
    return fechaISO
  }
}

/**
 * Página principal de Gestión del Tareo (CU-004).
 * Permite consultar, crear, editar y aprobar partes diarios.
 */
export default function TareoPage() {
  // Estados de datos
  const [fechaSeleccionada, setFechaSeleccionada] = useState('')
  const [parteActual, setParteActual] = useState<ParteDiarioCompleto | null>(null)
  const [cargandoParte, setCargandoParte] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Estados de catálogos (para mostrar nombres en la tabla)
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([])
  const [labores, setLabores] = useState<Labor[]>([])
  const [sublotes, setSublotes] = useState<Sublote[]>([])

  // Estados del modal
  const [modalAbierto, setModalAbierto] = useState(false)

  // Estados de acciones
  const [procesando, setProcesando] = useState(false)

  // ========== CARGA INICIAL DE CATÁLOGOS ==========

  useEffect(() => {
    async function cargarCatalogos() {
      try {
        const [trab, lab, sub] = await Promise.all([
          getTrabajadoresParaTareo(supabase),
          getLabores(supabase, false), // Todas las labores
          getSublotes(supabase)
        ])

        setTrabajadores(trab.data || [])
        setLabores(lab.data || [])
        setSublotes(sub.data || [])
      } catch (err) {
        console.error('Error al cargar catálogos:', err)
      }
    }

    cargarCatalogos()
  }, [])

  // ========== CARGA DE PARTE POR FECHA ==========

  const cargarPartePorFecha = async (fecha: string) => {
    if (!fecha) {
      setParteActual(null)
      return
    }

    setCargandoParte(true)
    setError(null)

    try {
      const { data, error: apiError } = await getParteDiarioPorFecha(supabase, fecha)

      if (apiError) {
        throw new Error(apiError)
      }

      setParteActual(data)
    } catch (err) {
      console.error('Error al cargar parte diario:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setCargandoParte(false)
    }
  }

  // Efecto para cargar parte cuando cambia la fecha
  useEffect(() => {
    if (fechaSeleccionada) {
      cargarPartePorFecha(fechaSeleccionada)
    }
  }, [fechaSeleccionada])

  // ========== HANDLERS DE ACCIONES ==========

  /**
   * Handler para crear un nuevo parte (abre modal).
   */
  const handleCrearParte = () => {
    setModalAbierto(true)
  }

  /**
   * Handler para editar parte existente.
   * Implementa advertencia para partes aprobados (RN-004-F).
   */
  const handleEditarParte = () => {
    if (parteActual?.estado === 'Aprobado') {
      const confirmar = window.confirm(
        '⚠️ ADVERTENCIA: Este parte ya está APROBADO.\n\n' +
        'Editarlo requiere justificación y generará un registro de auditoría (RN-004-F).\n\n' +
        '¿Deseas continuar con la edición?'
      )

      if (!confirmar) return
    }

    setModalAbierto(true)
  }

  /**
   * Handler para aprobar un parte.
   */
  const handleAprobar = async () => {
    if (!parteActual) return

    const confirmar = window.confirm(
      `¿Confirmas la aprobación del Parte Diario del ${formatearFecha(parteActual.fecha_parte)}?\n\n` +
      `Esto registrará ${parteActual.detalles.length} líneas de trabajo.`
    )

    if (!confirmar) return

    setProcesando(true)

    try {
      const { error } = await updateParteDiarioStatus(supabase, parteActual.id, 'Aprobado')

      if (error) {
        alert(`Error: ${error}`)
        return
      }

      alert('Parte Diario aprobado exitosamente.')
      await cargarPartePorFecha(fechaSeleccionada)
    } catch (err) {
      console.error('Error al aprobar:', err)
      alert('Error inesperado al aprobar el parte.')
    } finally {
      setProcesando(false)
    }
  }

  /**
   * Handler para rechazar un parte.
   */
  const handleRechazar = async () => {
    if (!parteActual) return

    const motivo = window.prompt(
      'Ingresa el motivo del rechazo (opcional):'
    )

    if (motivo === null) return // Cancelado

    setProcesando(true)

    try {
      const { error } = await updateParteDiarioStatus(supabase, parteActual.id, 'Rechazado')

      if (error) {
        alert(`Error: ${error}`)
        return
      }

      alert(`Parte Diario rechazado.${motivo ? `\nMotivo: ${motivo}` : ''}`)
      await cargarPartePorFecha(fechaSeleccionada)
    } catch (err) {
      console.error('Error al rechazar:', err)
      alert('Error inesperado al rechazar el parte.')
    } finally {
      setProcesando(false)
    }
  }

  /**
   * Handler para éxito del formulario.
   */
  const handleSuccess = async () => {
    setModalAbierto(false)
    await cargarPartePorFecha(fechaSeleccionada)
  }

  // ========== HELPERS DE VISUALIZACIÓN ==========

  const getNombreTrabajador = (id: string | number) => {
    const trabajador = trabajadores.find(t => t.id.toString() === id.toString())
    return trabajador?.nombre_completo || `ID: ${id}`
  }

  const getNombreLabor = (id: string | number) => {
    const labor = labores.find(l => l.id.toString() === id.toString())
    return labor?.nombre_labor || `ID: ${id}`
  }

  const getNombreSublote = (id: string | number) => {
    const sublote = sublotes.find(s => s.id.toString() === id.toString())
    return sublote?.nombre || `ID: ${id}`
  }

  // ========== RENDERIZADO ==========

  return (
    <div className="p-6 space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Gestión del Tareo (Parte Diario)
        </h1>
        <p className="text-gray-600 mt-1">
          Registro y aprobación del trabajo diario de campo (CU-004)
        </p>
      </div>

      {/* Información contextual */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5 mr-3"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium">Sobre el Parte Diario</p>
            <p className="mt-1">
              El Parte Diario (Tareo) registra el trabajo realizado por cada trabajador en cada labor y sublote.
              Es la base para el cálculo de planillas y la imputación de costos (MOD).
            </p>
          </div>
        </div>
      </div>

      {/* Selector de fecha */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Consultar Parte Diario por Fecha
        </h2>

        <div className="max-w-md">
          <Input
            label="Seleccionar Fecha"
            type="date"
            value={fechaSeleccionada}
            onChange={(e) => setFechaSeleccionada(e.target.value)}
          />
        </div>

        {cargandoParte && (
          <div className="mt-4 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600 text-sm">Cargando parte...</p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Contenido del parte */}
      {fechaSeleccionada && !cargandoParte && !error && (
        <>
          {!parteActual ? (
            // No existe parte para esta fecha
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <svg
                className="w-12 h-12 text-gray-400 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="text-gray-900 font-medium mb-1">
                No hay parte diario registrado
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                No existe un registro de trabajo para el {formatearFecha(fechaSeleccionada)}.
              </p>
              <Button onClick={handleCrearParte}>
                + Crear Parte Diario para el {formatearFecha(fechaSeleccionada)}
              </Button>
            </div>
          ) : (
            // Existe parte - Mostrar detalles
            <div className="space-y-6">
              {/* Cabecera del parte */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Parte Diario - {formatearFecha(parteActual.fecha_parte)}
                  </h2>
                  <EstadoBadge estado={parteActual.estado} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-600">Fecha</p>
                    <p className="font-medium text-gray-900">{formatearFecha(parteActual.fecha_parte)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Registros de Trabajo</p>
                    <p className="font-medium text-gray-900">{parteActual.detalles.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">ID del Parte</p>
                    <p className="font-medium text-gray-900">#{parteActual.id}</p>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                  {parteActual.estado === 'Pendiente' && (
                    <>
                      <Button onClick={handleEditarParte} variant="secondary">
                        Editar Parte
                      </Button>
                      <Button onClick={handleAprobar} disabled={procesando}>
                        {procesando ? 'Procesando...' : 'Aprobar Parte'}
                      </Button>
                      <Button onClick={handleRechazar} variant="secondary" disabled={procesando}>
                        Rechazar
                      </Button>
                    </>
                  )}

                  {parteActual.estado === 'Aprobado' && (
                    <>
                      <div className="flex-1 text-sm text-green-700 font-medium">
                        ✓ Este parte ha sido aprobado
                      </div>
                      <Button onClick={handleEditarParte} variant="secondary">
                        Editar (Requiere Auditoría)
                      </Button>
                    </>
                  )}

                  {parteActual.estado === 'Rechazado' && (
                    <>
                      <div className="flex-1 text-sm text-red-700 font-medium">
                        ✗ Este parte ha sido rechazado
                      </div>
                      <Button onClick={handleEditarParte} variant="secondary">
                        Corregir y Reenviar
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Tabla de detalles */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="font-semibold text-gray-900">Detalle del Trabajo Registrado</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trabajador
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Labor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sublote
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Horas Normales
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Horas Extras
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Avance (Destajo)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Factor Ajuste
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {parteActual.detalles.map((detalle: TareoDetalle) => (
                        <tr key={detalle.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {getNombreTrabajador(detalle.trabajador_id)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {getNombreLabor(detalle.labor_id)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {getNombreSublote(detalle.sublote_id)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {detalle.horas_imputadas ? `${detalle.horas_imputadas}h` : '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {detalle.horas_extras ? `${detalle.horas_extras}h` : '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {detalle.unidad_avance ? detalle.unidad_avance : '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {detalle.factor_ajuste_dia ? `${detalle.factor_ajuste_dia}%` : '100%'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de creación/edición */}
      <Modal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title={parteActual ? 'Editar Parte Diario' : 'Crear Parte Diario'}
      >
        <FormularioCapturaTareo
          onClose={() => setModalAbierto(false)}
          onSuccess={handleSuccess}
        />
      </Modal>
    </div>
  )
}
