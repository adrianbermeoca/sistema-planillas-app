import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, ParametroLegal } from '@/lib/database.types'
import { isPostgrestError } from '@/utils/isPostgrestError'

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