'use client'

import { useState } from 'react'
import { UserPlus, X, Loader2 } from 'lucide-react'
import { useFormStatus } from 'react-dom'
import { createMaestro } from '@/app/admin/maestros/actions'

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition flex items-center justify-center disabled:opacity-50"
        >
            {pending ? (
                <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creando...
                </>
            ) : (
                'Crear Maestro'
            )}
        </button>
    )
}

export default function AddMaestroButton() {
    const [isOpen, setIsOpen] = useState(false)
    const [state, setState] = useState<{ error?: string, success?: string } | null>(null)

    const handleSubmit = async (formData: FormData) => {
        const result = await createMaestro(null, formData)
        if (result.success) {
            setIsOpen(false)
            setState(null)
            // Optional: trigger a toast here
        } else {
            setState({ error: result.error })
        }
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center transition"
            >
                <UserPlus className="w-4 h-4 mr-2" /> Agregar Maestro
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <h2 className="text-xl font-bold text-gray-900 mb-4">Nuevo Maestro</h2>

                        {state?.error && (
                            <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
                                {state.error}
                            </div>
                        )}

                        <form action={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    required
                                    className="w-full rounded-md border border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2 text-gray-900 bg-white placeholder-gray-500"
                                    placeholder="Juan Pérez"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    className="w-full rounded-md border border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2 text-gray-900 bg-white placeholder-gray-500"
                                    placeholder="maestro@ejemplo.com"
                                />
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    className="w-full rounded-md border border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2 text-gray-900 bg-white placeholder-gray-500"
                                    placeholder="******"
                                    minLength={6}
                                />
                            </div>

                            <SubmitButton />
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
