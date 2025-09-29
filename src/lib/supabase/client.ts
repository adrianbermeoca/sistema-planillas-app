import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente tipado de Supabase con el esquema de la base de datos
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)

// Exportar tipos para facilitar su uso en componentes
export type { Database, Tables, TablesInsert, TablesUpdate, Enums } from '@/lib/database.types'

// Tipos específicos para el dominio (usando la nueva sintaxis)
export type Trabajador = Tables<'trabajadores'>
export type PuestoTrabajo = Tables<'puestos_de_trabajo'>
export type ParametroLegal = Tables<'parametros_legales'>
export type TrabajadorPuesto = Tables<'trabajador_puestos'>
export type Prueba = Tables<'pruebas'>

// Tipos para inserts
export type NuevoTrabajador = TablesInsert<'trabajadores'>
export type NuevoPuesto = TablesInsert<'puestos_de_trabajo'>
export type NuevoParametro = TablesInsert<'parametros_legales'>
export type NuevoTrabajadorPuesto = TablesInsert<'trabajador_puestos'>

// Tipos para updates
export type ActualizarTrabajador = TablesUpdate<'trabajadores'>
export type ActualizarPuesto = TablesUpdate<'puestos_de_trabajo'>
export type ActualizarParametro = TablesUpdate<'parametros_legales'>

// Enums
export type ModalidadLaboral = Enums<'modalidad_laboral'>
export type TipoParametro = Enums<'tipo_parametro'>