import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
    const response = await updateSession(request)

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: any) {
                    // Not needed in middleware
                },
                remove(name: string, options: any) {
                    // Not needed in middleware
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // Protected routes
    const isProtectedRoute = request.nextUrl.pathname.startsWith('/chat') ||
        request.nextUrl.pathname.startsWith('/admin')

    // Admin-only routes
    const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')

    // Redirect to login if not authenticated
    if (isProtectedRoute && !user) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check admin access
    if (isAdminRoute && user) {
        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (userData?.role !== 'admin') {
            return NextResponse.redirect(new URL('/chat', request.url))
        }
    }

    // Redirect to chat if already logged in and trying to access login
    if (request.nextUrl.pathname === '/login' && user) {
        return NextResponse.redirect(new URL('/chat', request.url))
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
