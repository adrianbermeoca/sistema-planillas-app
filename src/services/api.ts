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
 * @returns Promise con objeto { data, error }
 */
export async function getPuestosDeTrabajo(
  supabaseClient: SupabaseClient<Database>
): Promise<{ data: PuestoDeTrabajo[] | null; error: string | null }> {
  try {
    const { data, error } = await supabaseClient
      .from('puestos_de_trabajo')
      .select('id, nombre_puesto, tarifa_base_dia, created_at, es_activo')
      .eq('es_activo', true) // Filtro crítico para UI de Asignación - solo puestos activos
      .order('nombre_puesto', { ascending: true })

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
        trabajador_id: payload.trabajador_id,
        puesto_id: payload.puesto_id,
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
      .eq('id', trabajadorId)
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
      .eq('trabajador_id', trabajadorId)
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
      .eq('id', puestoId)
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
      .eq('id', puestoId)
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
      .eq('id', puestoId)
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