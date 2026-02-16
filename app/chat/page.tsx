'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import ChatList from '@/components/chat/ChatList'
import ChatPanel from '@/components/chat/ChatPanel'

export default function ChatPage() {
    const [user, setUser] = useState<any>(null)
    const [userRole, setUserRole] = useState<string | null>(null)
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            const { data: userData } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single()

            setUser(user)
            setUserRole(userData?.role || null)
            setLoading(false)
        }

        getUser()
    }, [router, supabase])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">✨</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold text-gray-900">CRM Esotérico</h1>
                        <p className="text-xs text-gray-500">
                            {userRole === 'admin' ? 'Administrador' : 'Maestro'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    {userRole === 'admin' && (
                        <button
                            onClick={() => router.push('/admin/dashboard')}
                            className="px-4 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition"
                        >
                            Admin
                        </button>
                    )}
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
                    >
                        Salir
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                <ChatList
                    userId={user.id}
                    userRole={userRole}
                    selectedConversationId={selectedConversationId}
                    onSelectConversation={setSelectedConversationId}
                />

                <ChatPanel
                    conversationId={selectedConversationId}
                    userId={user.id}
                    userRole={userRole}
                />
            </div>
        </div>
    )
}
