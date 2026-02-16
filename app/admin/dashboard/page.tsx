import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminDashboardPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (userData?.role !== 'admin') redirect('/chat')

    // Fetch metrics
    const { data: conversations } = await supabase
        .from('conversations')
        .select('status_pipeline, channel')

    const statusCounts = conversations?.reduce((acc: any, conv) => {
        acc[conv.status_pipeline] = (acc[conv.status_pipeline] || 0) + 1
        return acc
    }, {})

    const channelCounts = conversations?.reduce((acc: any, conv) => {
        acc[conv.channel] = (acc[conv.channel] || 0) + 1
        return acc
    }, {})

    const { count: totalLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })

    const { count: totalMaestros } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'maestro')

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
                    <p className="text-gray-600 mt-2">Vista general del CRM</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="text-sm font-medium text-gray-600">Total Conversaciones</div>
                        <div className="text-3xl font-bold text-gray-900 mt-2">{conversations?.length || 0}</div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="text-sm font-medium text-gray-600">Total Leads</div>
                        <div className="text-3xl font-bold text-gray-900 mt-2">{totalLeads || 0}</div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="text-sm font-medium text-gray-600">Maestros Activos</div>
                        <div className="text-3xl font-bold text-gray-900 mt-2">{totalMaestros || 0}</div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="text-sm font-medium text-gray-600">Conversiones</div>
                        <div className="text-3xl font-bold text-green-600 mt-2">{statusCounts?.pago || 0}</div>
                    </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pipeline Status */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Por Estado de Pipeline</h2>
                        <div className="space-y-3">
                            {Object.entries(statusCounts || {}).map(([status, count]: [string, any]) => (
                                <div key={status} className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 capitalize">{status}</span>
                                    <div className="flex items-center space-x-3">
                                        <div className="w-32 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-purple-600 h-2 rounded-full"
                                                style={{ width: `${(count / (conversations?.length || 1)) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Channel Distribution */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Por Canal</h2>
                        <div className="space-y-3">
                            {Object.entries(channelCounts || {}).map(([channel, count]: [string, any]) => (
                                <div key={channel} className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 capitalize">{channel}</span>
                                    <div className="flex items-center space-x-3">
                                        <div className="w-32 bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${channel === 'whatsapp' ? 'bg-green-600' :
                                                        channel === 'instagram' ? 'bg-pink-600' :
                                                            'bg-blue-600'
                                                    }`}
                                                style={{ width: `${(count / (conversations?.length || 1)) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-8 bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <a
                            href="/admin/maestros"
                            className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 transition text-center"
                        >
                            <div className="text-2xl mb-2">👥</div>
                            <div className="font-medium text-gray-900">Gestionar Maestros</div>
                        </a>
                        <a
                            href="/admin/tags"
                            className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 transition text-center"
                        >
                            <div className="text-2xl mb-2">🏷️</div>
                            <div className="font-medium text-gray-900">Gestionar Etiquetas</div>
                        </a>
                        <a
                            href="/chat"
                            className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 transition text-center"
                        >
                            <div className="text-2xl mb-2">💬</div>
                            <div className="font-medium text-gray-900">Ir al Chat</div>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
