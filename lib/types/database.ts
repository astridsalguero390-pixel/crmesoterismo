export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    email: string
                    full_name: string | null
                    role: 'admin' | 'maestro'
                    is_active: boolean
                    avatar_url: string | null
                    metadata: any
                    created_at: string
                    updated_at: string
                }
            }
            leads: {
                Row: {
                    id: string
                    phone_number: string | null
                    ig_scoped_id: string | null
                    fb_psid: string | null
                    full_name: string | null
                    profile_pic_url: string | null
                    metadata: any
                    created_at: string
                    updated_at: string
                }
            }
            conversations: {
                Row: {
                    id: string
                    lead_id: string
                    channel: 'whatsapp' | 'instagram' | 'messenger'
                    channel_thread_id: string | null
                    status_pipeline: 'nuevo' | 'calificado' | 'agendado' | 'pago' | 'seguimiento' | 'perdido'
                    owner_id: string | null
                    locked_by: string | null
                    locked_at: string | null
                    is_archived: boolean
                    last_message_at: string | null
                    unread_count: number
                    metadata: any
                    created_at: string
                    updated_at: string
                }
            }
            messages: {
                Row: {
                    id: string
                    conversation_id: string
                    channel: 'whatsapp' | 'instagram' | 'messenger'
                    sender_type: 'customer' | 'agent' | 'system'
                    message_type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'interactive'
                    content: string | null
                    media_url: string | null
                    status: string | null
                    external_message_id: string | null
                    metadata: any
                    created_at: string
                }
            }
            tags: {
                Row: {
                    id: string
                    name: string
                    color: string
                    description: string | null
                    created_at: string
                    updated_at: string
                }
            }
        }
    }
}
