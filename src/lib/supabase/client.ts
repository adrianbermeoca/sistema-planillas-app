import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente tipado de Supabase con el esquema de la base de datos
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)

// Función helper para crear una nueva instancia del cliente (útil en Server Components)
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}

// Exportar tipos para facilitar su uso en componentes
export type { Database, Tables, TablesInsert, TablesUpdate, Enums } from '@/lib/database.types'

// Tipos específicos para el dominio (usando la nueva sintaxis)
export type Trabajador = Tables<'trabajadores'>
export type PuestoTrabajo = Tables<'puestos_de_trabajo'>
export type ParametroLegal = Tables<'parametros_legales'>
export type TrabajadorPuesto = Tables<'trabajador_puestos'>
export type Prueba = Tables<'pruebas'>
export type Campo = Tables<'campos'>
export type Lote = Tables<'lotes'>
export type Sublote = Tables<'sublotes'>
export type Labor = Tables<'labor'>
export type Equipo = Tables<'equipos'>
export type OrdenDeTrabajo = Tables<'ordenes_de_trabajo'>
export type OTLaborDetalle = Tables<'ot_labor_detalle'>
export type ParteDiario = Tables<'partes_diarios'>
export type TareoDetalle = Tables<'tareo_detalle'>
export type Profile = Tables<'profiles'>

// Tipos para inserts
export type NuevoTrabajador = TablesInsert<'trabajadores'>
export type NuevoPuesto = TablesInsert<'puestos_de_trabajo'>
export type NuevoParametro = TablesInsert<'parametros_legales'>
export type NuevoTrabajadorPuesto = TablesInsert<'trabajador_puestos'>
export type NuevoCampo = TablesInsert<'campos'>
export type NuevoLote = TablesInsert<'lotes'>
export type NuevoSublote = TablesInsert<'sublotes'>
export type NuevaLabor = TablesInsert<'labor'>
export type NuevoEquipo = TablesInsert<'equipos'>
export type NuevaOrdenDeTrabajo = TablesInsert<'ordenes_de_trabajo'>
export type NuevoOTLaborDetalle = TablesInsert<'ot_labor_detalle'>
export type NuevoParteDiario = TablesInsert<'partes_diarios'>
export type NuevoTareoDetalle = TablesInsert<'tareo_detalle'>

// Tipos para updates
export type ActualizarTrabajador = TablesUpdate<'trabajadores'>
export type ActualizarPuesto = TablesUpdate<'puestos_de_trabajo'>
export type ActualizarParametro = TablesUpdate<'parametros_legales'>
export type ActualizarCampo = TablesUpdate<'campos'>
export type ActualizarLote = TablesUpdate<'lotes'>
export type ActualizarSublote = TablesUpdate<'sublotes'>
export type ActualizarLabor = TablesUpdate<'labor'>
export type ActualizarEquipo = TablesUpdate<'equipos'>
export type ActualizarOrdenDeTrabajo = TablesUpdate<'ordenes_de_trabajo'>
export type ActualizarParteDiario = TablesUpdate<'partes_diarios'>
export type ActualizarTareoDetalle = TablesUpdate<'tareo_detalle'>

// Enums
export type ModalidadLaboral = Enums<'modalidad_laboral'>
export type ModalidadTrabajador = Enums<'modalidad_trabajador_enum'>
export type TipoParametro = Enums<'tipo_parametro'>
export type TipoParametroLegal = Enums<'tipo_parametro_legal_enum'>
export type MetodoPago = Enums<'metodo_pago_enum'>
export type TipoTenencia = Enums<'tipo_tenencia_enum'>
export type EstadoParteDiario = Enums<'estado_parte_diario_enum'>
export type RolUsuario = Enums<'rol_usuario_enum'>