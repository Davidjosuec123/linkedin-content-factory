import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import { getSessions, getSession, type SessionSummary, type SessionResult } from "@/lib/api"
import PostPreview from "@/components/PostPreview"
import DesignGuide from "@/components/DesignGuide"

function timeAgo(ts: string): string {
  const date = new Date(ts)
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return "ahora"
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export default function History() {
  const router = useRouter()
  const { id } = router.query

  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [loadingList, setLoadingList] = useState(true)

  const [sessionDetail, setSessionDetail] = useState<SessionResult | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  useEffect(() => {
    getSessions()
      .then(setSessions)
      .catch(() => {})
      .finally(() => setLoadingList(false))
  }, [])

  useEffect(() => {
    if (!id || typeof id !== "string") {
      setSessionDetail(null)
      return
    }
    setLoadingDetail(true)
    setDetailError(null)
    getSession(id)
      .then(setSessionDetail)
      .catch(() => setDetailError("Sesión no encontrada"))
      .finally(() => setLoadingDetail(false))
  }, [id])

  if (id && typeof id === "string") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Detalle de Sesión</h1>
          <Link href="/history" className="text-sm text-neon-green hover:underline">
            ← Historial
          </Link>
        </div>

        {loadingDetail && (
          <p className="text-gray-500 text-sm font-mono">Cargando sesión...</p>
        )}

        {detailError && (
          <div className="bg-red-400/10 border border-red-400/30 rounded-xl p-4 text-red-400 text-sm">
            {detailError}
          </div>
        )}

        {sessionDetail && (
          <>
            <p className="text-xs text-gray-600 font-mono -mb-4">
              Sesión: {sessionDetail.session_id}
            </p>
            <PostPreview post={sessionDetail.linkedin_post} />
            <DesignGuide guide={sessionDetail.design_guide} />
            <details className="bg-dark-2 rounded-xl border border-dark-3">
              <summary className="px-6 py-4 text-sm text-gray-400 cursor-pointer hover:text-gray-200 font-mono">
                Ver estructura raw (raw_structure)
              </summary>
              <div className="px-6 pb-4">
                <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono">
                  {sessionDetail.raw_structure}
                </pre>
              </div>
            </details>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Historial</h1>
        <Link
          href="/"
          className="text-sm text-neon-green hover:underline"
        >
          ← Nuevo post
        </Link>
      </div>

      {loadingList && (
        <p className="text-gray-500 text-sm font-mono">Cargando...</p>
      )}

      {!loadingList && sessions.length === 0 && (
        <p className="text-gray-500 text-sm">Sin sesiones aún.</p>
      )}

      <div className="space-y-3">
        {sessions.map((s) => (
          <Link
            key={s.session_id}
            href={`/history?id=${s.session_id}`}
            className="block bg-dark-2 border border-dark-3 rounded-xl px-5 py-4 hover:bg-dark-3 hover:border-gray-600 transition-all duration-200"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">
                  {s.title || "Sin título"}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-gray-500">{timeAgo(s.timestamp)}</span>
                  <span className="text-gray-600">·</span>
                  <span className="text-xs text-gray-500 font-mono truncate">
                    {s.session_id.slice(0, 8)}...
                  </span>
                </div>
              </div>
              <span
                className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${
                  s.status === "completed"
                    ? "bg-neon-green/10 text-neon-green"
                    : s.status === "error"
                    ? "bg-red-400/10 text-red-400"
                    : "bg-yellow-400/10 text-yellow-400"
                }`}
              >
                {s.status === "completed" ? "Completado" : s.status}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
