interface TableProps {
  headers: string[]
  data: Record<string, any>[]
  className?: string
}

export default function Table({ headers, data, className = '' }: TableProps) {
  const tableStyles = `w-full border-collapse bg-white shadow-sm rounded-lg overflow-hidden ${className}`

  return (
    <div className="overflow-x-auto">
      <table className={tableStyles}>
        <thead className="bg-gray-50">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={headers.length}
                className="px-6 py-8 text-center text-gray-500"
              >
                No hay datos disponibles
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="hover:bg-gray-50 transition-colors duration-150"
              >
                {headers.map((header, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {row[header] !== undefined && row[header] !== null
                      ? String(row[header])
                      : '-'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}