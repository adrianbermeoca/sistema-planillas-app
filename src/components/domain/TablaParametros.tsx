import Table from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import type { ParametroLegal } from '@/lib/database.types'

interface TablaParametrosProps {
  onCrearNuevaVigencia: () => void
  parametros: ParametroLegal[]
}

export default function TablaParametros({ onCrearNuevaVigencia, parametros }: TablaParametrosProps) {
  const headers = ['Parámetro', 'Valor Actual', 'Vigencia', 'Estado', 'Descripción']

  // Función helper para formatear el tipo de parámetro
  const formatTipoParametro = (tipo: string): string => {
    const formatMap: Record<string, string> = {
      'rmv': 'RMV (Remuneración Mínima Vital)',
      'tasa_bono_beta': 'Tasa Bono BETA',
      'tasa_gratificacion': 'Gratificación Agraria',
      'tasa_cts': 'CTS Agraria',
      'tasa_essalud_extra': 'Tasa EsSalud Extra'
    }
    return formatMap[tipo] || tipo
  }

  // Función helper para formatear el valor
  const formatValor = (valor: number, tipo: string): string => {
    if (tipo === 'rmv') {
      return `S/ ${valor.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
    if (tipo.includes('tasa')) {
      return `${valor}%`
    }
    return valor.toString()
  }

  // Función helper para formatear la vigencia
  const formatVigencia = (fechaInicio: string, fechaFin: string | null): string => {
    const inicio = new Date(fechaInicio).toLocaleDateString('es-ES')
    if (fechaFin) {
      const fin = new Date(fechaFin).toLocaleDateString('es-ES')
      return `${inicio} - ${fin}`
    }
    return `Desde ${inicio}`
  }

  // Función helper para determinar el estado del parámetro
  const getEstadoParametro = (fechaInicio: string, fechaFin: string | null): { estado: string, color: string } => {
    const hoy = new Date()
    const inicio = new Date(fechaInicio)

    // Si tiene fecha de fin, verificarla
    if (fechaFin) {
      const fin = new Date(fechaFin)
      if (hoy > fin) {
        return { estado: 'Vencido', color: 'text-red-600 bg-red-50' }
      }
      if (hoy >= inicio && hoy <= fin) {
        return { estado: 'Vigente', color: 'text-green-600 bg-green-50' }
      }
      if (hoy < inicio) {
        return { estado: 'Futuro', color: 'text-blue-600 bg-blue-50' }
      }
    }

    // Sin fecha de fin
    if (hoy >= inicio) {
      return { estado: 'Vigente', color: 'text-green-600 bg-green-50' }
    } else {
      return { estado: 'Futuro', color: 'text-blue-600 bg-blue-50' }
    }
  }

  // Función helper para formatear la descripción
  const formatDescripcion = (descripcion: string | null): string => {
    if (!descripcion) return '-'
    return descripcion.length > 50
      ? `${descripcion.substring(0, 50)}...`
      : descripcion
  }

  // Convertir los datos reales para que coincidan con la interfaz de Table
  const dataForTable = parametros.map(param => {
    const estadoInfo = getEstadoParametro(param.fecha_inicio_vigencia, param.fecha_fin_vigencia)

    return {
      'Parámetro': formatTipoParametro(param.tipo),
      'Valor Actual': formatValor(param.valor, param.tipo),
      'Vigencia': formatVigencia(param.fecha_inicio_vigencia, param.fecha_fin_vigencia),
      'Estado': (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoInfo.color}`}>
          {estadoInfo.estado}
        </span>
      ),
      'Descripción': formatDescripcion(param.descripcion)
    }
  })

  return (
    <div className="space-y-6">
      {/* Header con título y botón */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Parámetros Legales Agrarios
          </h2>
          <p className="text-gray-600 mt-1">
            Gestión de parámetros según Ley N° 31110 del Régimen Laboral Agrario
          </p>
        </div>
        <Button
          onClick={onCrearNuevaVigencia}
          variant="primary"
        >
          Crear Nueva Vigencia
        </Button>
      </div>

      {/* Tabla de parámetros */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        {parametros.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay parámetros legales</h3>
            <p className="mt-1 text-sm text-gray-500">
              No se encontraron parámetros legales configurados en la base de datos.
            </p>
          </div>
        ) : (
          <Table
            headers={headers}
            data={dataForTable}
          />
        )}
      </div>

      {/* Información adicional */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Nota:</strong> Los parámetros mostrados corresponden a la normativa vigente
              de la Ley N° 31110. Las modificaciones requieren aprobación gerencial y deben
              respetar las fechas de vigencia establecidas por ley.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}