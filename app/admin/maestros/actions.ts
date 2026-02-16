'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createMaestro(prevState: any, formData: FormData) {
    const supabase = await createClient()

    // Check if requester is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (userData?.role !== 'admin') {
        return { error: 'No autorizado' }
    }

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string

    if (!email || !password || !fullName) {
        return { error: 'Todos los campos son requeridos' }
    }

    // Use Admin Client to create user without email verification
    const adminSupabase = await createAdminClient()
    const { data, error } = await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            full_name: fullName,
            role: 'maestro'
        }
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/admin/maestros')
    return { success: 'Maestro creado exitosamente' }
}
