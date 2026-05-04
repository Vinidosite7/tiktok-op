import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Rotas públicas — não precisam de auth
const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password', '/auth/callback']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Passa direto pra rotas públicas
  const isPublic = PUBLIC_ROUTES.some(r => pathname.startsWith(r))

  // Cria response mutável para o Supabase atualizar cookies de sessão
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request: { headers: request.headers } })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Sempre chama getUser pra Supabase poder renovar o token
  const { data: { user } } = await supabase.auth.getUser()

  // Não logado tentando acessar rota protegida → redireciona pro login
  if (!user && !isPublic) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname) // guarda rota original
    return NextResponse.redirect(loginUrl)
  }

  // Logado tentando acessar login/register → manda pro dashboard
  if (user && isPublic && pathname !== '/auth/callback') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    // Aplica em tudo exceto assets estáticos e arquivos internos do Next
    '/((?!_next/static|_next/image|favicon.ico|icon-|manifest|register-sw|.*\\.png|.*\\.svg|.*\\.ico).*)',
  ],
}
