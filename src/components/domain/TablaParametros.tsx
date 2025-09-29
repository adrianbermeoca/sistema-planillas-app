import Table from '@/components/ui/Table'
import Button from '@/components/ui/Button'

interface TablaParametrosProps {
  onCrearNuevaVigencia: () => void
}

interface ParametroLegal {
  parametro: string
  valorActual: string
  vigencia: string
}

export default function TablaParametros({ onCrearNuevaVigencia }: TablaParametrosProps) {
  // Mock data para parámetros legales
  const parametrosLegales: ParametroLegal[] = [
    {
      parametro: 'RMV (Remuneración Mínima Vital)',
      valorActual: 'S/ 1,025.00',
      vigencia: '01/01/2024 - Vigente'
    },
    {
      parametro: 'Tasa Bono BETA',
      valorActual: '30% de la RMV',
      vigencia: '01/01/2024 - Vigente'
    },
    {
      parametro: 'Gratificación Agraria',
      valorActual: '2 RMV anuales',
      vigencia: '15/01/2024 - Vigente'
    },
    {
      parametro: 'CTS Agraria',
      valorActual: '15 días por año',
      vigencia: '01/01/2024 - Vigente'
    }
  ]

  const headers = ['Parámetro', 'Valor Actual', 'Vigencia']

  // Convertir los datos para que coincidan con la interfaz de Table
  const dataForTable = parametrosLegales.map(param => ({
    'Parámetro': param.parametro,
    'Valor Actual': param.valorActual,
    'Vigencia': param.vigencia
  }))

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
        <Table
          headers={headers}
          data={dataForTable}
        />
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