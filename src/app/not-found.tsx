import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24 text-center">
      <h2 className="text-3xl font-bold mb-4">Pagina non trovata</h2>
      <p className="mb-8 text-muted-foreground">La risorsa richiesta non è stata trovata.</p>
      <Link 
        href="/"
        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      >
        Torna alla Home
      </Link>
    </div>
  )
}
