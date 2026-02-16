import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Tag, Trash2, ArrowLeft } from 'lucide-react'

export default async function TagsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (userData?.role !== 'admin') redirect('/chat')

    // Fetch tags
    const { data: tags } = await supabase
        .from('tags')
        .select('*')
        .order('name', { ascending: true })

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <Link href="/admin/dashboard" className="text-gray-500 hover:text-gray-700 flex items-center mb-2">
                            <ArrowLeft className="w-4 h-4 mr-1" /> Volver al Dashboard
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900">Gestión de Etiquetas</h1>
                        <p className="text-gray-600 mt-2">Crea y administra etiquetas para clasificar conversaciones.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Add Tag Form */}
                    <div className="bg-white rounded-lg shadow p-6 h-fit">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <Plus className="w-5 h-5 mr-2" /> Nueva Etiqueta
                        </h2>
                        <form action={async (formData) => {
                            'use server'
                            const createClient = (await import('@/lib/supabase/server')).createClient
                            const supabase = await createClient()
                            const name = formData.get('name') as string
                            const color = formData.get('color') as string

                            if (name) {
                                await supabase.from('tags').insert({ name, color })
                                redirect('/admin/tags')
                            }
                        }}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    placeholder="Ej: Tarot, Limpieza..."
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border"
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                                <div className="grid grid-cols-5 gap-2">
                                    {['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e', '#64748b'].map((c) => (
                                        <label key={c} className="cursor-pointer">
                                            <input type="radio" name="color" value={c} className="sr-only peer" />
                                            <div className="w-8 h-8 rounded-full bg-gray-100 peer-checked:ring-2 peer-checked:ring-offset-2 peer-checked:ring-gray-900 border border-gray-200" style={{ backgroundColor: c }}></div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
                                Crear Etiqueta
                            </button>
                        </form>
                    </div>

                    {/* Tags List */}
                    <div className="md:col-span-2 bg-white rounded-lg shadow overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                <Tag className="w-5 h-5 mr-2" /> Etiquetas Existentes ({tags?.length || 0})
                            </h2>
                        </div>
                        <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                            {tags?.map((tag) => (
                                <div key={tag.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                    <div className="flex items-center">
                                        <div className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: tag.color }}></div>
                                        <span className="text-gray-900 font-medium">{tag.name}</span>
                                    </div>
                                    <form action={async () => {
                                        'use server'
                                        const createClient = (await import('@/lib/supabase/server')).createClient
                                        const supabase = await createClient()
                                        await supabase.from('tags').delete().eq('id', tag.id)
                                        redirect('/admin/tags')
                                    }}>
                                        <button type="submit" className="text-gray-400 hover:text-red-600 transition">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </form>
                                </div>
                            ))}
                            {tags?.length === 0 && (
                                <div className="p-8 text-center text-gray-500">
                                    No hay etiquetas creadas.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
