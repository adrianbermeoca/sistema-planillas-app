import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, ParametroLegal } from '@/lib/database.types'

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
  // Validar formato de fechas
  const validateDateFormat = (dateString: string): boolean => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(dateString)) return false

    const date = new Date(dateString)
    return date instanceof Date && !isNaN(date.getTime())
  }

  // Validaciones
  if (!validateDateFormat(newParameterData.fecha_inicio_vigencia)) {
    throw new Error('Formato de fecha de inicio de vigencia inválido. Debe ser YYYY-MM-DD')
  }

  if (newParameterData.fecha_fin_vigencia && !validateDateFormat(newParameterData.fecha_fin_vigencia)) {
    throw new Error('Formato de fecha de fin de vigencia inválido. Debe ser YYYY-MM-DD')
  }

  // Validar que la fecha de fin sea posterior a la de inicio si existe
  if (newParameterData.fecha_fin_vigencia) {
    const fechaInicio = new Date(newParameterData.fecha_inicio_vigencia)
    const fechaFin = new Date(newParameterData.fecha_fin_vigencia)

    if (fechaFin <= fechaInicio) {
      throw new Error('La fecha de fin de vigencia debe ser posterior a la fecha de inicio')
    }
  }

  // Insertar el nuevo parámetro
  const { data, error } = await supabaseClient
    .from('parametros_legales')
    .insert([newParameterData])
    .select()
    .single()

  if (error) {
    console.error('Supabase error details:', error)
    throw new Error(error.message || 'Error desconocido al insertar en la base de datos')
  }

  if (!data) {
    throw new Error('No se pudo crear el parámetro legal - respuesta vacía')
  }

  return data
}