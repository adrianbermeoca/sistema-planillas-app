'use client'

import { useState } from 'react'
import TablaParametros from '@/components/domain/TablaParametros'
import FormularioNuevaVigencia from '@/components/domain/FormularioNuevaVigencia'

interface NuevaVigenciaData {
  parametro: string
  nuevoValor: string
  fechaInicioVigencia: string
}

export default function ParametrosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleAbrirModal = () => {
    setIsModalOpen(true)
  }

  const handleCerrarModal = () => {
    setIsModalOpen(false)
  }

  const handleGuardarVigencia = (data: NuevaVigenciaData) => {
    // TODO: Aquí se implementará la lógica para guardar en Supabase
    console.log('Guardando nueva vigencia:', data)

    // Simulación de guardado exitoso
    alert(`Nueva vigencia creada exitosamente:

Parámetro: ${data.parametro}
Nuevo Valor: ${data.nuevoValor}
Vigencia desde: ${new Date(data.fechaInicioVigencia).toLocaleDateString('es-ES')}

Esta vigencia será aplicada automáticamente a partir de la fecha especificada.`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li>
              <a href="#" className="hover:text-gray-700">Dashboard</a>
            </li>
            <li className="flex items-center">
              <svg className="h-4 w-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <span className="font-medium text-gray-900">Parámetros Legales</span>
            </li>
          </ol>
        </nav>

        {/* Contenido principal */}
        <main>
          <TablaParametros onCrearNuevaVigencia={handleAbrirModal} />
        </main>

        {/* Modal para crear nueva vigencia */}
        <FormularioNuevaVigencia
          isOpen={isModalOpen}
          onClose={handleCerrarModal}
          onSave={handleGuardarVigencia}
        />
      </div>
    </div>
  )
}