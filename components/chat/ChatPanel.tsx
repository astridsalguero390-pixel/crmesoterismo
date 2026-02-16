'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Phone, Instagram, Facebook, Send, Image as ImageIcon, Mic } from 'lucide-react'
import MessageInput from './MessageInput'

interface Message {
    id: string
    conversation_id: string
    sender_type: string
    message_type: string
    content: string
    media_url: string | null
    created_at: string
}

interface Conversation {
    id: string
    channel: string
    status_pipeline: string
    owner_id: string | null
    leads: {
        full_name: string
        profile_pic_url: string | null
    }
}

interface ChatPanelProps {
    conversationId: string | null
    userId: string
    userRole: string | null
}

export default function ChatPanel({ conversationId, userId, userRole }: ChatPanelProps) {
    const [conversation, setConversation] = useState<Conversation | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    useEffect(() => {
        if (!conversationId) {
            setConversation(null)
            setMessages([])
            return
        }

        fetchConversation()
        fetchMessages()

        // Subscribe to new messages
        const channel = supabase
            .channel(`messages-${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`,
                },
                (payload) => {
                    setMessages((prev) => [...prev, payload.new as Message])
                    scrollToBottom()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [conversationId])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const fetchConversation = async () => {
        if (!conversationId) return

        const { data } = await supabase
            .from('conversations')
            .select('*, leads(*)')
            .eq('id', conversationId)
            .single()

        if (data) {
            setConversation(data as any)
        }
    }

    const fetchMessages = async () => {
        if (!conversationId) return

        setLoading(true)
        const { data } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true })

        if (data) {
            setMessages(data)
        }
        setLoading(false)
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const handleSendMessage = async (content: string, mediaUrl?: string, messageType: string = 'text') => {
        if (!conversationId || !conversation) return

        try {
            // Call the appropriate send function based on channel
            const functionName = `send-${conversation.channel}`

            const { data: { session } } = await supabase.auth.getSession()

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${functionName}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session?.access_token}`,
                    },
                    body: JSON.stringify({
                        conversation_id: conversationId,
                        message_type: messageType,
                        content,
                        media_url: mediaUrl,
                    }),
                }
            )

            if (!response.ok) {
                const error = await response.json()
                console.error('Error sending message:', error)
                alert('Error al enviar mensaje: ' + (error.error || 'Unknown error'))
            }
        } catch (error) {
            console.error('Error sending message:', error)
            alert('Error al enviar mensaje')
        }
    }

    const getChannelIcon = (channel: string) => {
        switch (channel) {
            case 'whatsapp':
                return <Phone className="w-5 h-5 text-green-600" />
            case 'instagram':
                return <Instagram className="w-5 h-5 text-pink-600" />
            case 'messenger':
                return <Facebook className="w-5 h-5 text-blue-600" />
            default:
                return null
        }
    }

    if (!conversationId) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Send className="w-12 h-12 text-purple-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        Selecciona una conversación
                    </h2>
                    <p className="text-gray-500">
                        Elige un chat de la lista para comenzar a responder
                    </p>
                </div>
            </div>
        )
    }

    if (!conversation) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        )
    }

    return (
        <div className="flex-1 flex flex-col bg-white">
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <img
                            src={conversation.leads.profile_pic_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.leads.full_name)}&background=8b5cf6&color=fff`}
                            alt={conversation.leads.full_name}
                            className="w-10 h-10 rounded-full"
                        />
                        <div>
                            <h2 className="font-semibold text-gray-900">{conversation.leads.full_name}</h2>
                            <div className="flex items-center space-x-2">
                                {getChannelIcon(conversation.channel)}
                                <span className="text-sm text-gray-500 capitalize">{conversation.channel}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <select
                            value={conversation.status_pipeline}
                            onChange={async (e) => {
                                await supabase
                                    .from('conversations')
                                    .update({ status_pipeline: e.target.value })
                                    .eq('id', conversationId)
                                fetchConversation()
                            }}
                            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            <option value="nuevo">Nuevo</option>
                            <option value="calificado">Calificado</option>
                            <option value="agendado">Agendado</option>
                            <option value="pago">Pago</option>
                            <option value="seguimiento">Seguimiento</option>
                            <option value="perdido">Perdido</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-12">
                        No hay mensajes aún
                    </div>
                ) : (
                    messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.sender_type === 'agent' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[70%] rounded-2xl px-4 py-2 ${message.sender_type === 'agent'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-white border border-gray-200 text-gray-900'
                                    }`}
                            >
                                {message.message_type === 'image' && message.media_url && (
                                    <img
                                        src={message.media_url}
                                        alt="Imagen"
                                        className="rounded-lg mb-2 max-w-full"
                                    />
                                )}
                                {message.message_type === 'audio' && message.media_url && (
                                    <audio controls className="mb-2">
                                        <source src={message.media_url} />
                                    </audio>
                                )}
                                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                                <p
                                    className={`text-xs mt-1 ${message.sender_type === 'agent' ? 'text-purple-200' : 'text-gray-500'
                                        }`}
                                >
                                    {format(new Date(message.created_at), 'HH:mm', { locale: es })}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <MessageInput onSendMessage={handleSendMessage} />
        </div>
    )
}
