import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', background: '#080810',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: 'sans-serif',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <p style={{ fontSize: 80, fontWeight: 800, margin: '0 0 8px',
          background: 'linear-gradient(135deg, #7c6ef7, #9d8fff)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          fontFamily: 'Syne, sans-serif', lineHeight: 1 }}>
          404
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e8e8f0',
          margin: '0 0 10px', fontFamily: 'Syne, sans-serif' }}>
          Página não encontrada
        </h1>
        <p style={{ fontSize: 14, color: '#4a4a6a', margin: '0 0 32px', lineHeight: 1.6 }}>
          A página que você buscou não existe ou foi movida.
        </p>
        <Link href="/dashboard" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '12px 24px', borderRadius: 12, fontSize: 14,
          fontWeight: 600, color: 'white', textDecoration: 'none',
          background: 'linear-gradient(135deg, #7c6ef7, #9d8fff)',
          boxShadow: '0 4px 24px rgba(124,110,247,0.35)',
        }}>
          Voltar ao painel
        </Link>
      </div>
    </div>
  )
}
