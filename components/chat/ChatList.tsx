'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { MessageCircle, Phone, Instagram, Facebook } from 'lucide-react'

interface Conversation {
    id: string
    lead_id: string
    channel: string
    status_pipeline: string
    owner_id: string | null
    last_message_at: string
    unread_count: number
    leads: {
        full_name: string
        profile_pic_url: string | null
        phone_number: string | null
    }
}

interface ChatListProps {
    userId: string
    userRole: string | null
    selectedConversationId: string | null
    onSelectConversation: (id: string) => void
}

export default function ChatList({
    userId,
    userRole,
    selectedConversationId,
    onSelectConversation,
}: ChatListProps) {
    const [activeTab, setActiveTab] = useState<'my' | 'unassigned' | 'all'>('my')
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        fetchConversations()

        // Subscribe to realtime updates
        const channel = supabase
            .channel('conversations-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'conversations',
                },
                () => {
                    fetchConversations()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [activeTab, userId, userRole])

    const fetchConversations = async () => {
        setLoading(true)
        let query = supabase
            .from('conversations')
            .select('*, leads(*)')
            .eq('is_archived', false)
            .order('last_message_at', { ascending: false })

        if (activeTab === 'my') {
            query = query.eq('owner_id', userId)
        } else if (activeTab === 'unassigned') {
            query = query.is('owner_id', null)
        }
        // 'all' tab doesn't filter by owner

        const { data, error } = await query

        if (!error && data) {
            setConversations(data as any)
        }
        setLoading(false)
    }

    const getChannelIcon = (channel: string) => {
        switch (channel) {
            case 'whatsapp':
                return <Phone className="w-4 h-4 text-green-600" />
            case 'instagram':
                return <Instagram className="w-4 h-4 text-pink-600" />
            case 'messenger':
                return <Facebook className="w-4 h-4 text-blue-600" />
            default:
                return <MessageCircle className="w-4 h-4 text-gray-600" />
        }
    }

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            nuevo: 'bg-blue-100 text-blue-800',
            calificado: 'bg-yellow-100 text-yellow-800',
            agendado: 'bg-purple-100 text-purple-800',
            pago: 'bg-green-100 text-green-800',
            seguimiento: 'bg-orange-100 text-orange-800',
            perdido: 'bg-red-100 text-red-800',
        }
        return colors[status] || 'bg-gray-100 text-gray-800'
    }

    return (
        <div className="w-full md:w-96 bg-white border-r border-gray-200 flex flex-col">
            {/* Tabs */}
            <div className="border-b border-gray-200">
                <div className="flex">
                    <button
                        onClick={() => setActiveTab('my')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition ${activeTab === 'my'
                                ? 'text-purple-600 border-b-2 border-purple-600'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Mis Chats
                    </button>

                    {userRole === 'admin' && (
                        <>
                            <button
                                onClick={() => setActiveTab('unassigned')}
                                className={`flex-1 px-4 py-3 text-sm font-medium transition ${activeTab === 'unassigned'
                                        ? 'text-purple-600 border-b-2 border-purple-600'
                                        : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                Sin Asignar
                            </button>
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`flex-1 px-4 py-3 text-sm font-medium transition ${activeTab === 'all'
                                        ? 'text-purple-600 border-b-2 border-purple-600'
                                        : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                Todos
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="text-center py-12 px-4">
                        <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">No hay conversaciones</p>
                    </div>
                ) : (
                    conversations.map((conv) => (
                        <button
                            key={conv.id}
                            onClick={() => onSelectConversation(conv.id)}
                            className={`w-full p-4 border-b border-gray-100 hover:bg-gray-50 transition text-left ${selectedConversationId === conv.id ? 'bg-purple-50' : ''
                                }`}
                        >
                            <div className="flex items-start space-x-3">
                                <div className="relative flex-shrink-0">
                                    <img
                                        src={conv.leads.profile_pic_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.leads.full_name)}&background=8b5cf6&color=fff`}
                                        alt={conv.leads.full_name}
                                        className="w-12 h-12 rounded-full"
                                    />
                                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                                        {getChannelIcon(conv.channel)}
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="font-medium text-gray-900 truncate">
                                            {conv.leads.full_name}
                                        </h3>
                                        {conv.last_message_at && (
                                            <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                                                {formatDistanceToNow(new Date(conv.last_message_at), {
                                                    addSuffix: true,
                                                    locale: es,
                                                })}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(conv.status_pipeline)}`}>
                                            {conv.status_pipeline}
                                        </span>
                                        {conv.unread_count > 0 && (
                                            <span className="bg-purple-600 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                                                {conv.unread_count}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    )
}
