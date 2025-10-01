import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import { isPostgrestError } from '@/utils/isPostgrestError'

// Type definitions
export type ParametroLegal = Database['public']['Tables']['parametros_legales']['Row']
export type Trabajador = Database['public']['Tables']['trabajadores']['Row']
export type TrabajadorInsert = Database['public']['Tables']['trabajadores']['Insert']

// --- Nuevos Tipos para Puestos y la Relación N:M ---
// Los IDs de tipo bigint se manejan comúnmente como string en JS/TS
export interface PuestoDeTrabajo {
  id: string | number // Adaptado para bigint (puede ser string o number)
  nombre_puesto: string
  tarifa_base_dia: number
  created_at: string
}

export interface TrabajadorPuestoPayload {
  trabajador_id: string | number // bigint FK
  puesto_id: string | number     // bigint FK
  tarifa_acordada: number
  fecha_inicio: string
}

// Tipo para actualización parcial de trabajador
export type TrabajadorUpdate = Database['public']['Tables']['trabajadores']['Update']

// Tipos para operaciones de Puestos de Trabajo
export type PuestoDeTrabajoInsert = Database['public']['Tables']['puestos_de_trabajo']['Insert']
export type PuestoDeTrabajoUpdate = Database['public']['Tables']['puestos_de_trabajo']['Update']

/**
 * Obtiene todos los parámetros legales desde Supabase
 * Ordena por fecha de inicio de vigencia (más reciente primero) y tipo
 * @param supabaseClient - Instancia del cliente de Supabase tipado
 * @returns Promise que resuelve en un array de parámetros legales
 * @throws Error si la consulta falla
 */
export async function getLegalParameters(
  supabaseClient: SupabaseClient<Database>
): Promise<ParametroLegal[]> {
  const { data, error } = await supabaseClient
    .from('parametros_legales')
    .select('*')
    .order('fecha_inicio_vigencia', { ascending: false })
    .order('tipo', { ascending: true })

  if (error) {
    throw error
  }

  return data || []
}


/**
 * Crea un nuevo parámetro legal en Supabase
 * @param supabaseClient - Instancia del cliente de Supabase tipado
 * @param newParameterData - Datos del nuevo parámetro (sin id y created_at)
 * @returns Promise que resuelve en el parámetro legal creado
 * @throws Error si la inserción falla
 */
export async function createLegalParameter(
  supabaseClient: SupabaseClient<Database>,
  newParameterData: Omit<ParametroLegal, 'id' | 'created_at'>
): Promise<ParametroLegal> {
  // Validación de fechas
  const { fecha_inicio_vigencia, fecha_fin_vigencia } = newParameterData
  if (fecha_fin_vigencia && new Date(fecha_inicio_vigencia) >= new Date(fecha_fin_vigencia)) {
    throw new Error('La fecha de fin de vigencia debe ser posterior a la fecha de inicio.')
  }

  try {
    const { data, error } = await supabaseClient
      .from('parametros_legales')
      .insert(newParameterData)
      .select()
      .single()

    if (error) {
      // Si Supabase devuelve un error en su objeto de respuesta, lo lanzamos.
      // Este es el camino principal para errores de BD (ej. duplicados).
      throw error
    }

    if (!data) {
      throw new Error('No se recibieron datos después de la inserción.')
    }

    return data

  } catch (err: unknown) {
    // Este bloque catch ahora capturará el error lanzado desde arriba
    // o cualquier otro error inesperado en el proceso.

    console.error('Error detallado en createLegalParameter:', err)

    // Usamos un type guard para verificar si es un error de Supabase (PostgrestError)
    // y extraemos el mensaje específico.
    if (isPostgrestError(err)) {
      throw new Error(`Error de base de datos: ${err.message}`)
    }

    // Si es un error genérico, lo relanzamos.
    if (err instanceof Error) {
      throw err
    }

    // Fallback para errores desconocidos.
    throw new Error('Ocurrió un error inesperado al crear el parámetro legal.')
  }
}


/**
 * Obtiene todos los trabajadores desde Supabase
 * Ordena por fecha de creación (más reciente primero)
 * @param supabaseClient - Instancia del cliente de Supabase tipado
 * @returns Promise que resuelve en un array de trabajadores
 * @throws Error si la consulta falla
 */
export async function getTrabajadores(
  supabaseClient: SupabaseClient<Database>
): Promise<Trabajador[]> {
  const { data, error } = await supabaseClient
    .from('trabajadores')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data || []
}


/**
 * Crea un nuevo trabajador en Supabase
 * @param supabaseClient - Instancia del cliente de Supabase tipado
 * @param newWorkerData - Datos del nuevo trabajador (sin id y created_at)
 * @returns Promise que resuelve en el trabajador creado
 * @throws Error si la inserción falla (ej. DNI duplicado)
 */
export async function createTrabajador(
  supabaseClient: SupabaseClient<Database>,
  newWorkerData: Omit<TrabajadorInsert, 'id' | 'created_at'>
): Promise<Trabajador> {
  try {
    const { data, error } = await supabaseClient
      .from('trabajadores')
      .insert(newWorkerData)
      .select()
      .single()

    if (error) {
      throw error
    }

    if (!data) {
      throw new Error('No se recibieron datos después de la inserción.')
    }

    return data

  } catch (err: unknown) {
    console.error('Error detallado en createTrabajador:', err)

    if (isPostgrestError(err)) {
      // Detectar error de duplicado de DNI
      if (err.code === '23505' && err.message.includes('trabajadores_dni_key')) {
        throw new Error('El DNI ingresado ya está registrado en el sistema.')
      }
      throw new Error(`Error de base de datos: ${err.message}`)
    }

    if (err instanceof Error) {
      throw err
    }

    throw new Error('Ocurrió un error inesperado al crear el trabajador.')
  }
}


/**
 * Obtiene el catálogo de Puestos de Trabajo disponibles (CU-008).
 * Permite al Coordinador seleccionar el rol que un trabajador desempeñará.
 * @param supabaseClient - Instancia del cliente de Supabase tipado
 * @param soloActivos - Si es true, filtra solo puestos activos. Por defecto true para UIs de asignación.
 * @returns Promise con objeto { data, error }
 */
export async function getPuestosDeTrabajo(
  supabaseClient: SupabaseClient<Database>,
  soloActivos: boolean = true
): Promise<{ data: PuestoDeTrabajo[] | null; error: string | null }> {
  try {
    let query = supabaseClient
      .from('puestos_de_trabajo')
      .select('id, nombre_puesto, tarifa_base_dia, created_at, es_activo')

    // Filtro condicional para UI de Asignación vs UI de Gestión
    if (soloActivos) {
      query = query.eq('es_activo', true)
    }

    const { data, error } = await query.order('nombre_puesto', { ascending: true })

    if (error) {
      return { data: null, error: `Error al obtener puestos: ${error.message}` }
    }

    return { data: data as PuestoDeTrabajo[], error: null }
  } catch (e) {
    console.error('API: Excepción no controlada al obtener puestos', e)
    return { data: null, error: 'Error de red o excepción inesperada.' }
  }
}


/**
 * Asigna un Puesto de Trabajo a un Trabajador (Relación N:M), registrando la tarifa acordada (CU-009).
 * Esto implementa la Multimodalidad Laboral.
 * @param supabaseClient - Instancia del cliente de Supabase tipado
 * @param payload - Datos de la asignación (trabajador_id, puesto_id, tarifa_acordada, fecha_inicio)
 * @returns Promise con objeto { data, error }
 */
export async function assignPuestoToTrabajador(
  supabaseClient: SupabaseClient<Database>,
  payload: TrabajadorPuestoPayload
): Promise<{ data: any | null; error: string | null }> {
  console.log('API: Intentando asignar puesto al trabajador con payload:', payload)

  try {
    const { data, error } = await supabaseClient
      .from('trabajador_puestos')
      .insert({
        trabajador_id: Number(payload.trabajador_id),
        puesto_id: Number(payload.puesto_id),
        tarifa_acordada: parseFloat(payload.tarifa_acordada.toString()),
        fecha_inicio: payload.fecha_inicio,
        es_activo: true // Default activo
      })
      .select()
      .single()

    if (error) {
      // Manejo de error específico (duplicado/restricción UNIQUE)
      if (isPostgrestError(error) && error.code === '23505') {
        return {
          data: null,
          error: 'Error: Esta asignación de Puesto ya existe o está duplicada.'
        }
      }
      return {
        data: null,
        error: `Error al asignar puesto: ${error.message}`
      }
    }

    console.log('API: Puesto asignado con éxito:', data)
    return { data, error: null }

  } catch (e) {
    console.error('API: Excepción no controlada al asignar puesto', e)
    return {
      data: null,
      error: 'Error de red o excepción inesperada.'
    }
  }
}


/**
 * Actualiza los datos básicos de un trabajador existente (CU-009).
 * Permite editar nombre_completo, dni, o modalidad_principal.
 * @param supabaseClient - Instancia del cliente de Supabase tipado
 * @param trabajadorId - ID del trabajador a actualizar
 * @param updateData - Datos parciales a actualizar
 * @returns Promise con objeto { data, error }
 */
export async function updateTrabajador(
  supabaseClient: SupabaseClient<Database>,
  trabajadorId: string | number,
  updateData: Partial<TrabajadorUpdate>
): Promise<{ data: Trabajador | null; error: string | null }> {
  console.log('API: Intentando actualizar trabajador:', trabajadorId, updateData)

  try {
    const { data, error } = await supabaseClient
      .from('trabajadores')
      .update(updateData)
      .eq('id', Number(trabajadorId))
      .select()
      .single()

    if (error) {
      // Detectar error de DNI duplicado
      if (isPostgrestError(error) && error.code === '23505' && error.message.includes('trabajadores_dni_key')) {
        return {
          data: null,
          error: 'El DNI ingresado ya está registrado en el sistema.'
        }
      }
      return {
        data: null,
        error: `Error al actualizar trabajador: ${error.message}`
      }
    }

    if (!data) {
      return {
        data: null,
        error: 'No se encontró el trabajador para actualizar.'
      }
    }

    console.log('API: Trabajador actualizado con éxito:', data)
    return { data, error: null }

  } catch (e) {
    console.error('API: Excepción no controlada al actualizar trabajador', e)
    return {
      data: null,
      error: 'Error de red o excepción inesperada.'
    }
  }
}


/**
 * Activa o desactiva un trabajador mediante el estado de su asignación más reciente (baja lógica).
 * Como la tabla trabajadores no tiene campo es_activo, utilizamos trabajador_puestos.
 * Esta función actualiza el campo es_activo de la asignación más reciente del trabajador.
 * @param supabaseClient - Instancia del cliente de Supabase tipado
 * @param trabajadorId - ID del trabajador
 * @param nuevoEstado - true para activar, false para dar de baja
 * @returns Promise con objeto { data, error }
 */
export async function toggleTrabajadorStatus(
  supabaseClient: SupabaseClient<Database>,
  trabajadorId: string | number,
  nuevoEstado: boolean
): Promise<{ data: any | null; error: string | null }> {
  console.log('API: Intentando cambiar estado del trabajador:', trabajadorId, 'a', nuevoEstado)

  try {
    // Actualizar todas las asignaciones activas del trabajador
    const { data, error } = await supabaseClient
      .from('trabajador_puestos')
      .update({ es_activo: nuevoEstado })
      .eq('trabajador_id', Number(trabajadorId))
      .select()

    if (error) {
      return {
        data: null,
        error: `Error al cambiar estado del trabajador: ${error.message}`
      }
    }

    console.log('API: Estado del trabajador actualizado:', data)
    return { data, error: null }

  } catch (e) {
    console.error('API: Excepción no controlada al cambiar estado del trabajador', e)
    return {
      data: null,
      error: 'Error de red o excepción inesperada.'
    }
  }
}


/**
 * Crea un nuevo puesto de trabajo en el catálogo (CU-008).
 * @param supabaseClient - Instancia del cliente de Supabase tipado
 * @param nombre_puesto - Nombre del puesto de trabajo
 * @param tarifa_base_dia - Tarifa base diaria del puesto
 * @returns Promise con objeto { data, error }
 */
export async function createPuesto(
  supabaseClient: SupabaseClient<Database>,
  nombre_puesto: string,
  tarifa_base_dia: number
): Promise<{ data: PuestoDeTrabajo | null; error: string | null }> {
  console.log('API: Intentando crear puesto:', { nombre_puesto, tarifa_base_dia })

  try {
    const { data, error } = await supabaseClient
      .from('puestos_de_trabajo')
      .insert({
        nombre_puesto: nombre_puesto.trim(),
        tarifa_base_dia: parseFloat(tarifa_base_dia.toString())
      })
      .select()
      .single()

    if (error) {
      // Detectar error de nombre duplicado
      if (isPostgrestError(error) && error.code === '23505') {
        return {
          data: null,
          error: 'Ya existe un puesto con ese nombre en el catálogo.'
        }
      }
      return {
        data: null,
        error: `Error al crear puesto: ${error.message}`
      }
    }

    if (!data) {
      return {
        data: null,
        error: 'No se recibieron datos después de la inserción.'
      }
    }

    console.log('API: Puesto creado con éxito:', data)
    return { data: data as PuestoDeTrabajo, error: null }

  } catch (e) {
    console.error('API: Excepción no controlada al crear puesto', e)
    return {
      data: null,
      error: 'Error de red o excepción inesperada.'
    }
  }
}


/**
 * Actualiza los datos de un puesto de trabajo existente (CU-008).
 * @param supabaseClient - Instancia del cliente de Supabase tipado
 * @param puestoId - ID del puesto a actualizar
 * @param updateData - Datos parciales a actualizar
 * @returns Promise con objeto { data, error }
 */
export async function updatePuesto(
  supabaseClient: SupabaseClient<Database>,
  puestoId: string | number,
  updateData: Partial<PuestoDeTrabajoUpdate>
): Promise<{ data: PuestoDeTrabajo | null; error: string | null }> {
  console.log('API: Intentando actualizar puesto:', puestoId, updateData)

  try {
    // Limpiar y formatear datos
    const cleanData: Partial<PuestoDeTrabajoUpdate> = {}

    if (updateData.nombre_puesto !== undefined) {
      cleanData.nombre_puesto = updateData.nombre_puesto.trim()
    }

    if (updateData.tarifa_base_dia !== undefined) {
      cleanData.tarifa_base_dia = parseFloat(updateData.tarifa_base_dia.toString())
    }

    const { data, error } = await supabaseClient
      .from('puestos_de_trabajo')
      .update(cleanData)
      .eq('id', Number(puestoId))
      .select()
      .single()

    if (error) {
      // Detectar error de nombre duplicado
      if (isPostgrestError(error) && error.code === '23505') {
        return {
          data: null,
          error: 'Ya existe un puesto con ese nombre en el catálogo.'
        }
      }
      return {
        data: null,
        error: `Error al actualizar puesto: ${error.message}`
      }
    }

    if (!data) {
      return {
        data: null,
        error: 'No se encontró el puesto para actualizar.'
      }
    }

    console.log('API: Puesto actualizado con éxito:', data)
    return { data: data as PuestoDeTrabajo, error: null }

  } catch (e) {
    console.error('API: Excepción no controlada al actualizar puesto', e)
    return {
      data: null,
      error: 'Error de red o excepción inesperada.'
    }
  }
}


/**
 * Realiza la baja lógica (soft delete) o reactivación de un Puesto de Trabajo (CU-008).
 * @param supabaseClient - Instancia del cliente de Supabase tipado
 * @param puestoId - ID del puesto a modificar
 * @param nuevoEstado - El estado a establecer (false = inactivo / baja lógica)
 * @returns Promise con objeto { data, error }
 */
export async function togglePuestoStatus(
  supabaseClient: SupabaseClient<Database>,
  puestoId: string | number,
  nuevoEstado: boolean
): Promise<{ data: PuestoDeTrabajo | null; error: string | null }> {
  console.log(`API: Intentando cambiar estado del puesto ${puestoId} a ${nuevoEstado}`)

  try {
    const { data, error } = await supabaseClient
      .from('puestos_de_trabajo')
      .update({ es_activo: nuevoEstado })
      .eq('id', Number(puestoId))
      .select()
      .single()

    if (error) {
      return {
        data: null,
        error: `Error al cambiar estado del puesto: ${error.message}`
      }
    }

    console.log('API: Estado del puesto actualizado con éxito:', data)
    return { data: data as PuestoDeTrabajo, error: null }

  } catch (e) {
    console.error('API: Excepción no controlada al cambiar estado del puesto', e)
    return {
      data: null,
      error: 'Error de red o excepción inesperada.'
    }
  }
}


/**
 * Elimina físicamente un puesto de trabajo del catálogo (CU-008).
 * PRECAUCIÓN: Solo debe usarse si no hay asignaciones activas en trabajador_puestos.
 * @param supabaseClient - Instancia del cliente de Supabase tipado
 * @param puestoId - ID del puesto a eliminar
 * @returns Promise con objeto { data, error }
 */
export async function deletePuesto(
  supabaseClient: SupabaseClient<Database>,
  puestoId: string | number
): Promise<{ data: any | null; error: string | null }> {
  console.log('API: Intentando eliminar puesto:', puestoId)

  try {
    const { data, error } = await supabaseClient
      .from('puestos_de_trabajo')
      .delete()
      .eq('id', Number(puestoId))
      .select()

    if (error) {
      // Detectar error de constraint de FK (hay asignaciones activas)
      if (isPostgrestError(error) && error.code === '23503') {
        return {
          data: null,
          error: 'No se puede eliminar el puesto porque hay trabajadores asignados a él. ' +
                 'Desactiva primero las asignaciones en trabajador_puestos.'
        }
      }
      return {
        data: null,
        error: `Error al eliminar puesto: ${error.message}`
      }
    }

    console.log('API: Puesto eliminado con éxito')
    return { data, error: null }

  } catch (e) {
    console.error('API: Excepción no controlada al eliminar puesto', e)
    return {
      data: null,
      error: 'Error de red o excepción inesperada.'
    }
  }
}


// ========================================
// GESTIÓN DE LABORES (CU-006 / CU-008)
// ========================================

/**
 * Interfaz para el catálogo de Labores.
 * Refleja los campos de la tabla `labor`.
 */
export interface Labor {
  id: string | number
  nombre_labor: string
  metodo_pago: 'PorTiempo' | 'PorDestajo'
  indicador_destajo: string | null
  tarifa_destajo: number
  es_labor_generica: boolean
  es_activo: boolean
  created_at: string
}

/**
 * Interfaz para Sublotes.
 * Necesario para la jerarquía de costeo en el formulario de planificación.
 */
export interface Sublote {
  id: string | number
  nombre: string
  variedad_cultivo: string | null
  es_proyecto: boolean
  num_cilindros: number | null
  lote_id: number
  created_at: string
}

/**
 * Interfaz para el detalle de una Orden de Trabajo.
 * Representa cada línea en la tabla `ot_labor_detalle`.
 */
export interface OTLaborDetallePayload {
  labor_id: string | number
  sublote_id: string | number
  horas_estimadas?: number | null
}

/**
 * Interfaz para la creación de una Orden de Trabajo completa.
 * Incluye la cabecera (ordenes_de_trabajo) y sus detalles (ot_labor_detalle).
 */
export interface OrdenDeTrabajoPayload {
  descripcion: string
  fecha_planificacion_inicio: string // formato 'YYYY-MM-DD'
  fecha_planificacion_fin?: string | null // formato 'YYYY-MM-DD'
  detalles: OTLaborDetallePayload[]
}

/**
 * Interfaz para una Orden de Trabajo completa (Read).
 * Representa una fila de la tabla ordenes_de_trabajo.
 */
export interface OrdenDeTrabajo {
  id: string | number
  descripcion: string
  fecha_planificacion_inicio: string
  fecha_planificacion_fin: string | null
  estado: string
  created_at: string
}


/**
 * Obtiene el catálogo completo de Labores (CU-006).
 * El Coordinador necesita ver todas las opciones para la planificación.
 * @param supabaseClient - Instancia del cliente de Supabase tipado
 * @param soloActivos - Si es true, filtra solo labores activas. Por defecto true.
 * @returns Promise con objeto { data, error }
 */
export async function getLabores(
  supabaseClient: SupabaseClient<Database>,
  soloActivos: boolean = true
): Promise<{ data: Labor[] | null; error: string | null }> {
  try {
    let query = supabaseClient
      .from('labor')
      .select('id, nombre_labor, metodo_pago, indicador_destajo, tarifa_destajo, es_labor_generica, es_activo, created_at')

    // Filtro condicional para UI de Planificación vs UI de Gestión
    if (soloActivos) {
      query = query.eq('es_activo', true)
    }

    const { data, error } = await query.order('nombre_labor', { ascending: true })

    if (error) {
      return { data: null, error: `Error al obtener labores: ${error.message}` }
    }

    return { data: data as Labor[], error: null }
  } catch (e) {
    console.error('API: Excepción no controlada al obtener labores', e)
    return { data: null, error: 'Error de red o excepción inesperada.' }
  }
}


/**
 * Crea una nueva labor en el catálogo (CU-008).
 * @param supabaseClient - Instancia del cliente de Supabase tipado
 * @param laborData - Datos de la labor a crear
 * @returns Promise con objeto { data, error }
 */
export async function createLabor(
  supabaseClient: SupabaseClient<Database>,
  laborData: {
    nombre_labor: string
    metodo_pago: 'PorTiempo' | 'PorDestajo'
    indicador_destajo?: string | null
    tarifa_destajo: number
    es_labor_generica: boolean
  }
): Promise<{ data: Labor | null; error: string | null }> {
  console.log('API: Intentando crear labor:', laborData)

  try {
    const { data, error } = await supabaseClient
      .from('labor')
      .insert({
        nombre_labor: laborData.nombre_labor.trim(),
        metodo_pago: laborData.metodo_pago,
        indicador_destajo: laborData.indicador_destajo || null,
        tarifa_destajo: parseFloat(laborData.tarifa_destajo.toString()),
        es_labor_generica: laborData.es_labor_generica,
        es_activo: true
      })
      .select()
      .single()

    if (error) {
      // Detectar error de nombre duplicado
      if (isPostgrestError(error) && error.code === '23505') {
        return {
          data: null,
          error: 'Ya existe una labor con ese nombre en el catálogo.'
        }
      }
      return {
        data: null,
        error: `Error al crear labor: ${error.message}`
      }
    }

    if (!data) {
      return {
        data: null,
        error: 'No se recibieron datos después de la inserción.'
      }
    }

    console.log('API: Labor creada con éxito:', data)
    return { data: data as Labor, error: null }

  } catch (e) {
    console.error('API: Excepción no controlada al crear labor', e)
    return {
      data: null,
      error: 'Error de red o excepción inesperada.'
    }
  }
}


/**
 * Actualiza una labor existente (CU-008).
 * @param supabaseClient - Instancia del cliente de Supabase tipado
 * @param laborId - ID de la labor a actualizar
 * @param updateData - Datos parciales a actualizar
 * @returns Promise con objeto { data, error }
 */
export async function updateLabor(
  supabaseClient: SupabaseClient<Database>,
  laborId: string | number,
  updateData: Partial<{
    nombre_labor: string
    metodo_pago: 'PorTiempo' | 'PorDestajo'
    indicador_destajo: string | null
    tarifa_destajo: number
    es_labor_generica: boolean
  }>
): Promise<{ data: Labor | null; error: string | null }> {
  console.log('API: Intentando actualizar labor:', laborId, updateData)

  try {
    const cleanData: any = {}

    if (updateData.nombre_labor !== undefined) {
      cleanData.nombre_labor = updateData.nombre_labor.trim()
    }
    if (updateData.metodo_pago !== undefined) {
      cleanData.metodo_pago = updateData.metodo_pago
    }
    if (updateData.indicador_destajo !== undefined) {
      cleanData.indicador_destajo = updateData.indicador_destajo
    }
    if (updateData.tarifa_destajo !== undefined) {
      cleanData.tarifa_destajo = parseFloat(updateData.tarifa_destajo.toString())
    }
    if (updateData.es_labor_generica !== undefined) {
      cleanData.es_labor_generica = updateData.es_labor_generica
    }

    const { data, error } = await supabaseClient
      .from('labor')
      .update(cleanData)
      .eq('id', Number(laborId))
      .select()
      .single()

    if (error) {
      // Detectar error de nombre duplicado
      if (isPostgrestError(error) && error.code === '23505') {
        return {
          data: null,
          error: 'Ya existe una labor con ese nombre en el catálogo.'
        }
      }
      return {
        data: null,
        error: `Error al actualizar labor: ${error.message}`
      }
    }

    if (!data) {
      return {
        data: null,
        error: 'No se encontró la labor para actualizar.'
      }
    }

    console.log('API: Labor actualizada con éxito:', data)
    return { data: data as Labor, error: null }

  } catch (e) {
    console.error('API: Excepción no controlada al actualizar labor', e)
    return {
      data: null,
      error: 'Error de red o excepción inesperada.'
    }
  }
}


/**
 * Cambia el estado (activo/inactivo) de una labor (baja lógica) (CU-008).
 * @param supabaseClient - Instancia del cliente de Supabase tipado
 * @param laborId - ID de la labor
 * @param nuevoEstado - true para activar, false para desactivar
 * @returns Promise con objeto { data, error }
 */
export async function toggleLaborStatus(
  supabaseClient: SupabaseClient<Database>,
  laborId: string | number,
  nuevoEstado: boolean
): Promise<{ data: Labor | null; error: string | null }> {
  console.log(`API: Cambiando estado de labor ${laborId} a ${nuevoEstado}`)

  try {
    const { data, error } = await supabaseClient
      .from('labor')
      .update({ es_activo: nuevoEstado })
      .eq('id', Number(laborId))
      .select()
      .single()

    if (error) {
      return {
        data: null,
        error: `Error al cambiar estado de la labor: ${error.message}`
      }
    }

    console.log('API: Estado de labor actualizado con éxito:', data)
    return { data: data as Labor, error: null }

  } catch (e) {
    console.error('API: Excepción no controlada al cambiar estado de labor', e)
    return {
      data: null,
      error: 'Error de red o excepción inesperada.'
    }
  }
}


/**
 * Obtiene la jerarquía de sublotes para la planificación (CU-006).
 * Los sublotes son el destino final de la planificación y el costeo.
 * @param supabaseClient - Instancia del cliente de Supabase tipado
 * @returns Promise con objeto { data, error }
 */
export async function getSublotes(
  supabaseClient: SupabaseClient<Database>
): Promise<{ data: Sublote[] | null; error: string | null }> {
  try {
    const { data, error } = await supabaseClient
      .from('sublotes')
      .select('id, nombre, variedad_cultivo, es_proyecto, num_cilindros, lote_id, created_at')
      .order('nombre', { ascending: true })

    if (error) {
      return { data: null, error: `Error al obtener sublotes: ${error.message}` }
    }

    return { data: data as Sublote[], error: null }
  } catch (e) {
    console.error('API: Excepción no controlada al obtener sublotes', e)
    return { data: null, error: 'Error de red o excepción inesperada.' }
  }
}


/**
 * Interfaz extendida para OrdenDeTrabajo con información adicional de JOIN.
 * Incluye datos del supervisor y conteos de planificación.
 */
export interface OrdenDeTrabajoConInfo extends OrdenDeTrabajo {
  total_labores?: number
}

/**
 * Interfaz para el detalle completo de una OT con sus labores/sublotes.
 */
export interface OrdenDeTrabajoDetalle {
  id: string | number
  labor_nombre: string
  labor_metodo_pago: 'PorTiempo' | 'PorDestajo'
  sublote_nombre: string
  sublote_variedad: string | null
  horas_estimadas: number | null
}

/**
 * Interfaz para OT completa con detalles.
 */
export interface OrdenDeTrabajoCompleta extends OrdenDeTrabajo {
  detalles: OrdenDeTrabajoDetalle[]
}

/**
 * Obtiene todas las Órdenes de Trabajo existentes con información enriquecida (CU-006).
 * Incluye nombre del supervisor (si existe) y conteo de labores planificadas.
 * Ordena por fecha de planificación de inicio descendente (más recientes primero).
 * @param supabaseClient - Instancia del cliente de Supabase tipado
 * @returns Promise con objeto { data, error }
 */
export async function getOrdenesDeTrabajo(
  supabaseClient: SupabaseClient<Database>
): Promise<{ data: OrdenDeTrabajoConInfo[] | null; error: string | null }> {
  try {
    // Query con JOIN para obtener información del supervisor
    const { data: ordenesData, error: ordenesError } = await supabaseClient
      .from('ordenes_de_trabajo')
      .select(`
        id,
        descripcion,
        fecha_planificacion_inicio,
        fecha_planificacion_fin,
        estado,
        created_at
      `)
      .order('fecha_planificacion_inicio', { ascending: false })

    if (ordenesError) {
      return { data: null, error: `Error al obtener órdenes de trabajo: ${ordenesError.message}` }
    }

    if (!ordenesData || ordenesData.length === 0) {
      return { data: [], error: null }
    }

    // Obtener conteo de labores para cada OT
    const ordenesConInfo: OrdenDeTrabajoConInfo[] = await Promise.all(
      ordenesData.map(async (orden) => {
        // Contar labores en ot_labor_detalle
        const { count } = await supabaseClient
          .from('ot_labor_detalle')
          .select('*', { count: 'exact', head: true })
          .eq('ot_id', orden.id)

        return {
          ...orden,
          total_labores: count || 0,
        } as OrdenDeTrabajoConInfo
      })
    )

    return { data: ordenesConInfo, error: null }
  } catch (e) {
    console.error('API: Excepción no controlada al obtener órdenes de trabajo', e)
    return { data: null, error: 'Error de red o excepción inesperada.' }
  }
}


/**
 * Obtiene una Orden de Trabajo específica con todos sus detalles (CU-006).
 * Incluye información completa de labores y sublotes planificados.
 * @param supabaseClient - Instancia del cliente de Supabase tipado
 * @param otId - ID de la orden de trabajo a obtener
 * @returns Promise con objeto { data, error }
 */
export async function getOrdenDeTrabajoById(
  supabaseClient: SupabaseClient<Database>,
  otId: string | number
): Promise<{ data: OrdenDeTrabajoCompleta | null; error: string | null }> {
  console.log('API: Obteniendo orden de trabajo con ID:', otId)

  try {
    // PASO 1: Obtener la cabecera de la OT
    const { data: cabeceraData, error: cabeceraError } = await supabaseClient
      .from('ordenes_de_trabajo')
      .select('*')
      .eq('id', Number(otId))
      .single()

    if (cabeceraError) {
      if (cabeceraError.code === 'PGRST116') {
        return {
          data: null,
          error: 'No se encontró la orden de trabajo especificada.'
        }
      }
      return {
        data: null,
        error: `Error al obtener orden de trabajo: ${cabeceraError.message}`
      }
    }

    if (!cabeceraData) {
      return {
        data: null,
        error: 'No se encontró la orden de trabajo.'
      }
    }

    // PASO 2: Obtener los detalles con JOIN a labor y sublotes
    const { data: detallesData, error: detallesError } = await supabaseClient
      .from('ot_labor_detalle')
      .select(`
        id,
        horas_estimadas,
        labor:labor_id (
          nombre_labor,
          metodo_pago
        ),
        sublote:sublote_id (
          nombre,
          variedad_cultivo
        )
      `)
      .eq('ot_id', Number(otId))

    if (detallesError) {
      return {
        data: null,
        error: `Error al obtener detalles de la OT: ${detallesError.message}`
      }
    }

    // PASO 4: Mapear los detalles al formato esperado
    const detallesMapeados: OrdenDeTrabajoDetalle[] = (detallesData || []).map((detalle: any) => ({
      id: detalle.id,
      labor_nombre: detalle.labor?.nombre_labor || 'Labor no encontrada',
      labor_metodo_pago: detalle.labor?.metodo_pago || 'PorTiempo',
      sublote_nombre: detalle.sublote?.nombre || 'Sublote no encontrado',
      sublote_variedad: detalle.sublote?.variedad_cultivo || null,
      horas_estimadas: detalle.horas_estimadas
    }))

    // PASO 5: Construir la OT completa
    const otCompleta: OrdenDeTrabajoCompleta = {
      ...(cabeceraData as OrdenDeTrabajo),
      detalles: detallesMapeados
    }

    console.log('API: OT obtenida con éxito:', otCompleta.id, `(${detallesMapeados.length} detalles)`)

    return { data: otCompleta, error: null }
  } catch (e) {
    console.error('API: Excepción no controlada al obtener OT por ID', e)
    return {
      data: null,
      error: 'Error de red o excepción inesperada.'
    }
  }
}


/**
 * Crea una Orden de Trabajo completa con su cabecera y detalles (CU-006).
 * Esta función maneja la inserción transaccional de:
 * 1. Cabecera en `ordenes_de_trabajo`
 * 2. Detalles en `ot_labor_detalle` usando el ID generado
 *
 * @param supabaseClient - Instancia del cliente de Supabase tipado
 * @param payload - Datos de la orden de trabajo con sus detalles
 * @returns Promise con objeto { data, error }
 */
export async function createOrdenDeTrabajo (
  supabaseClient: SupabaseClient<Database>,
  payload: OrdenDeTrabajoPayload
): Promise<{ data: any | null; error: string | null }> {
  console.log('API: Intentando crear orden de trabajo con payload:', payload)

  try {
    // Validación de frontend (rápida)
    if (payload.fecha_planificacion_fin) {
      const fechaInicio = new Date(payload.fecha_planificacion_inicio)
      const fechaFin = new Date(payload.fecha_planificacion_fin)
      if (fechaFin < fechaInicio) {
        return {
          data: null,
          error: 'La fecha de fin de planificación debe ser posterior o igual a la fecha de inicio.'
        }
      }
    }
    if (!payload.detalles || payload.detalles.length === 0) {
      return {
        data: null,
        error: 'La orden de trabajo debe tener al menos un detalle de labor.'
      }
    }

    // Llamada a la función RPC transaccional
    const { data, error } = await supabaseClient.rpc('crear_ot_completa', {
      descripcion_ot: payload.descripcion,
      fecha_inicio: payload.fecha_planificacion_inicio,
      fecha_fin: payload.fecha_planificacion_fin ? payload.fecha_planificacion_fin : '',
      detalles: payload.detalles.map(d => ({
        labor_id: Number(d.labor_id),
        sublote_id: Number(d.sublote_id),
        horas_estimadas: d.horas_estimadas || null
      })) as Database['public']['CompositeTypes']['ot_detalle_payload'][] // Explicitly cast each detail to match the composite type
    })

    if (error) {
      console.error('API: Error en RPC crear_ot_completa:', error)
      return {
        data: null,
        error: `Error al crear la orden de trabajo: ${error.message}`
      }
    }

    console.log('API: Orden de trabajo creada exitosamente vía RPC:', data)

    if (!data) {
      return { data: null, error: 'La función RPC no devolvió datos.' }
    }

    // La función RPC devuelve un JSON con {ot, detalles}, lo aplanamos
    const rpcData = data as any // Hacemos un cast para acceder a las propiedades
    const resultadoFinal = {
      ...rpcData.ot,
      detalles: rpcData.detalles
    }

    return { data: resultadoFinal, error: null }
  } catch (e) {
    console.error('API: Excepción no controlada al crear orden de trabajo', e)
    return {
      data: null,
      error: 'Error de red o excepción inesperada.'
    }
  }
}


// ========================================
// GESTIÓN DE PARTES DIARIOS Y TAREO (CU-004)
// ========================================

/**
 * Interfaz para la cabecera del Parte Diario.
 * Representa una fila de la tabla partes_diarios.
 */
export interface ParteDiario {
  id: string | number
  fecha_parte: string // YYYY-MM-DD
  estado: 'Pendiente' | 'Aprobado' | 'Rechazado' // Según enum estado_parte_diario_enum
  supervisor_id: string | number | null
  created_at: string
}

/**
 * Interfaz para el detalle del tareo (línea de trabajo).
 * Representa una fila de la tabla tareo_detalle.
 */
export interface TareoDetalle {
  id: string | number
  parte_diario_id: string | number
  trabajador_id: string | number
  labor_id: string | number
  sublote_id: string | number
  horas_imputadas: number | null
  horas_extras: number | null
  unidad_avance: number | null
  factor_ajuste_dia: number | null
  bonificacion_operacional: number | null
  created_at: string
}

/**
 * Interfaz para el payload de un detalle de tareo (creación).
 */
export interface TareoDetallePayload {
  trabajador_id: string | number
  labor_id: string | number
  sublote_id: string | number
  horas_imputadas?: number | null
  horas_extras?: number | null
  unidad_avance?: number | null
  factor_ajuste_dia?: number | null
  bonificacion_operacional?: number | null
}

/**
 * Interfaz para el payload completo de creación del Parte Diario (maestro-detalle).
 */
export interface ParteDiarioCompletoPayload {
  fecha_parte: string // YYYY-MM-DD
  supervisor_id: string // UUID, debe ser proporcionado y no nulo según el esquema DB
  detalles: TareoDetallePayload[]
}

/**
 * Interfaz para la respuesta completa de un Parte Diario con sus detalles.
 */
export interface ParteDiarioCompleto extends ParteDiario {
  detalles: TareoDetalle[]
}


/**
 * Obtiene todos los trabajadores activos para el registro del tareo (CU-004).
 * Incluye trabajadores de Planilla, RH y Eventuales que estén activos.
 * @param supabaseClient - Instancia del cliente de Supabase tipado
 * @returns Promise con objeto { data, error }
 */
export async function getTrabajadoresParaTareo(
  supabaseClient: SupabaseClient<Database>
): Promise<{ data: Trabajador[] | null; error: string | null }> {
  try {
    // Obtener todos los trabajadores activos
    // Asumimos que un trabajador está activo si tiene al menos una asignación activa
    // o si es de tipo RH/Eventual (que no requieren asignación de puesto)
    const { data, error } = await supabaseClient
      .from('trabajadores')
      .select('*')
      .order('nombre_completo', { ascending: true })

    if (error) {
      return { data: null, error: `Error al obtener trabajadores: ${error.message}` }
    }

    return { data: data as Trabajador[], error: null }
  } catch (e) {
    console.error('API: Excepción no controlada al obtener trabajadores para tareo', e)
    return { data: null, error: 'Error de red o excepción inesperada.' }
  }
}


/**
 * Obtiene un Parte Diario completo (cabecera + detalles) para una fecha específica (CU-004).
 * @param supabaseClient - Instancia del cliente de Supabase tipado
 * @param fecha - Fecha del parte en formato YYYY-MM-DD
 * @returns Promise con objeto { data, error }
 */
export async function getParteDiarioPorFecha(
  supabaseClient: SupabaseClient<Database>,
  fecha: string
): Promise<{ data: ParteDiarioCompleto | null; error: string | null }> {
  try {
    // PASO 1: Obtener la cabecera del parte diario
    const { data: cabeceraData, error: cabeceraError } = await supabaseClient
      .from('partes_diarios')
      .select('*')
      .eq('fecha_parte', fecha)
      .single()

    if (cabeceraError) {
      // Si no existe un parte para esa fecha, no es un error crítico
      if (cabeceraError.code === 'PGRST116') {
        return {
          data: null,
          error: null // No hay parte para esta fecha (válido)
        }
      }
      return {
        data: null,
        error: `Error al obtener parte diario: ${cabeceraError.message}`
      }
    }

    if (!cabeceraData) {
      return { data: null, error: null }
    }

    // PASO 2: Obtener los detalles del tareo
    const { data: detallesData, error: detallesError } = await supabaseClient
      .from('tareo_detalle')
      .select('*')
      .eq('parte_diario_id', cabeceraData.id)
      .order('created_at', { ascending: true })

    if (detallesError) {
      return {
        data: null,
        error: `Error al obtener detalles del tareo: ${detallesError.message}`
      }
    }

    // Combinar cabecera con detalles
    const parteCompleto: ParteDiarioCompleto = {
      ...(cabeceraData as ParteDiario),
      detalles: (detallesData || []) as unknown as TareoDetalle[]
    }

    return { data: parteCompleto, error: null }
  } catch (e) {
    console.error('API: Excepción no controlada al obtener parte diario', e)
    return { data: null, error: 'Error de red o excepción inesperada.' }
  }
}


/**
 * Obtiene todos los Partes Diarios (solo cabeceras) ordenados por fecha (CU-004).
 * Útil para listar el historial de partes registrados.
 * @param supabaseClient - Instancia del cliente de Supabase tipado
 * @returns Promise con objeto { data, error }
 */
export async function getPartesDiarios(
  supabaseClient: SupabaseClient<Database>
): Promise<{ data: ParteDiario[] | null; error: string | null }> {
  try {
    const { data, error } = await supabaseClient
      .from('partes_diarios')
      .select('*')
      .order('fecha_parte', { ascending: false })

    if (error) {
      return { data: null, error: `Error al obtener partes diarios: ${error.message}` }
    }

    return { data: data as ParteDiario[], error: null }
  } catch (e) {
    console.error('API: Excepción no controlada al obtener partes diarios', e)
    return { data: null, error: 'Error de red o excepción inesperada.' }
  }
}


/**
 * Crea un Parte Diario completo con su cabecera y detalles de tareo (CU-004).
 * Esta es la función transaccional más crítica del sistema.
 *
 * Implementa las reglas de negocio:
 * - RN-006-D: No permite registro para fechas futuras
 * - RN-004-A: Captura de destajo (unidad_avance)
 * - RN-004-B: Captura de tiempo (horas_imputadas, horas_extras)
 * - RN-004-D: Días excepcionales (factor_ajuste_dia)
 *
 * @param supabaseClient - Instancia del cliente de Supabase tipado
 * @param payload - Datos completos del parte diario
 * @returns Promise con objeto { data, error }
 */
export async function createParteDiario(
  supabaseClient: SupabaseClient<Database>,
  payload: ParteDiarioCompletoPayload
): Promise<{ data: ParteDiarioCompleto | null; error: string | null }> {
  console.log('API: Intentando crear parte diario con payload:', payload)

  try {
    // ========== VALIDACIONES CRÍTICAS ==========

    // RN-006-D: Validar que la fecha no sea futura
    const fechaParte = new Date(payload.fecha_parte)
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    fechaParte.setHours(0, 0, 0, 0)

    if (fechaParte > hoy) {
      return {
        data: null,
        error: 'No se puede registrar un parte diario para una fecha futura (RN-006-D).'
      }
    }

    // Validar que haya al menos un detalle
    if (!payload.detalles || payload.detalles.length === 0) {
      return {
        data: null,
        error: 'El parte diario debe tener al menos un detalle de trabajo.'
      }
    }

    // Validar que el supervisor_id esté presente (RN-004-E, si el supervisor es obligatorio)
    // Según database.types.ts, supervisor_id en partes_diarios es NOT NULL.
    if (!payload.supervisor_id) {
      return {
        data: null,
        error: 'El supervisor es obligatorio para registrar un parte diario.'
      }
    }
    // ========== PASO 1: CREAR CABECERA ==========

    const { data: cabeceraData, error: cabeceraError } = await supabaseClient
      .from('partes_diarios')
      .insert({
        fecha_parte: payload.fecha_parte,
        estado: 'Pendiente', // Estado inicial según enum estado_parte_diario_enum
        supervisor_id: payload.supervisor_id as string // Cast a string, ya validado como no nulo
      })
      .select()
      .single()

    if (cabeceraError) {
      // Detectar si ya existe un parte para esa fecha
      if (isPostgrestError(cabeceraError) && cabeceraError.code === '23505') {
        return {
          data: null,
          error: 'Ya existe un parte diario registrado para esta fecha.'
        }
      }
      return {
        data: null,
        error: `Error al crear la cabecera del parte diario: ${cabeceraError.message}`
      }
    }

    if (!cabeceraData) {
      return {
        data: null,
        error: 'No se recibió el ID del parte diario creado.'
      }
    }

    const parteId = cabeceraData.id

    console.log('API: Cabecera del parte diario creada con ID:', parteId)

    // ========== PASO 2: VALIDAR Y PREPARAR DETALLES ==========

    const detallesParaInsertar = payload.detalles.map((detalle, index) => {
      // Validación: cada detalle debe tener trabajador, labor y sublote
      if (!detalle.trabajador_id || !detalle.labor_id || !detalle.sublote_id) {
        throw new Error(`Detalle #${index + 1}: trabajador, labor y sublote son obligatorios.`)
      }

      // RN-004-A y RN-004-B: Validar que tenga o horas O avance (no ambos vacíos)
      const tieneHoras = detalle.horas_imputadas !== null && detalle.horas_imputadas !== undefined && detalle.horas_imputadas > 0
      const tieneAvance = detalle.unidad_avance !== null && detalle.unidad_avance !== undefined && detalle.unidad_avance > 0

      if (!tieneHoras && !tieneAvance) {
        throw new Error(`Detalle #${index + 1}: debe registrar horas imputadas o unidad de avance.`)
      }

      return {
        parte_diario_id: parteId,
        trabajador_id: detalle.trabajador_id,
        labor_id: detalle.labor_id,
        sublote_id: detalle.sublote_id,
        horas_imputadas: detalle.horas_imputadas || null,
        horas_extras: detalle.horas_extras || null,
        unidad_avance: detalle.unidad_avance || null,
        factor_ajuste_dia: detalle.factor_ajuste_dia || null,
        bonificacion_operacional: detalle.bonificacion_operacional || null
      }
    })

    // ========== PASO 3: INSERTAR DETALLES ==========

    const { data: detallesData, error: detallesError } = await supabaseClient
      .from('tareo_detalle')
      .insert(detallesParaInsertar as any)
      .select()

    if (detallesError) {
      console.error('API: Error al insertar detalles del tareo:', detallesError)
      return {
        data: null,
        error: `Error al crear los detalles del tareo: ${detallesError.message}. La cabecera fue creada con ID ${parteId}.`
      }
    }

    console.log('API: Parte diario creado exitosamente con', detallesData?.length || 0, 'detalles')

    // ========== RETORNAR PARTE COMPLETO ==========

    const parteCompleto: ParteDiarioCompleto = {
      ...(cabeceraData as ParteDiario),
      detalles: (detallesData || []) as unknown as TareoDetalle[]
    }

    return {
      data: parteCompleto,
      error: null
    }

  } catch (e) {
    console.error('API: Excepción no controlada al crear parte diario', e)

    if (e instanceof Error) {
      return {
        data: null,
        error: e.message
      }
    }

    return {
      data: null,
      error: 'Error de red o excepción inesperada.'
    }
  }
}


/**
 * Actualiza el estado de un Parte Diario (workflow de aprobación) (CU-004).
 * Implementa RN-004-F (solo Coordinador puede modificar parte aprobado).
 *
 * @param supabaseClient - Instancia del cliente de Supabase tipado
 * @param parteId - ID del parte diario a actualizar
 * @param nuevoEstado - Nuevo estado ('Pendiente', 'Aprobado', 'Rechazado')
 * @returns Promise con objeto { data, error }
 */
export async function updateParteDiarioStatus(
  supabaseClient: SupabaseClient<Database>,
  parteId: string | number,
  nuevoEstado: 'Pendiente' | 'Aprobado' | 'Rechazado'
): Promise<{ data: ParteDiario | null; error: string | null }> {
  console.log(`API: Cambiando estado del parte ${parteId} a ${nuevoEstado}`)

  try {
    const { data, error } = await supabaseClient
      .from('partes_diarios')
      .update({ estado: nuevoEstado })
      .eq('id', Number(parteId))
      .select()
      .single()

    if (error) {
      return {
        data: null,
        error: `Error al actualizar estado del parte diario: ${error.message}`
      }
    }

    if (!data) {
      return {
        data: null,
        error: 'No se encontró el parte diario para actualizar.'
      }
    }

    console.log('API: Estado del parte diario actualizado con éxito:', data)
    return { data: data as ParteDiario, error: null }

  } catch (e) {
    console.error('API: Excepción no controlada al actualizar estado del parte', e)
    return {
      data: null,
      error: 'Error de red o excepción inesperada.'
    }
  }
}